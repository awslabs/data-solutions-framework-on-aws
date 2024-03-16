// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { join } from 'path';


import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, IPrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnCluster, CfnConfiguration } from 'aws-cdk-lib/aws-msk';

import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { InvocationType, Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';
import { mskAclAdminProviderSetup } from './msk-helpers';
import { clientAuthenticationSetup, monitoringSetup } from './msk-provisioned-cluster-setup';
import { Acl, KafkaClientLogLevel, MskProvisionedProps } from './msk-provisioned-props';
import {

  ClusterConfigurationInfo,
  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,

  KafkaVersion, MskBrokerInstanceType, //ClusterConfigurationInfo,

} from './msk-provisioned-props-utils';
//import { MskTopic } from './msk-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { MskTopic } from './msk-serverless-props';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

/**
 * A construct to create an MSK Provisioned cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 */
export class MskProvisioned extends TrackedConstruct {


  public static createCLusterConfiguration(
    scope: Construct,
    id: string,
    name: string,
    serverPropertiesFilePath: string,
    kafkaVersions: KafkaVersion[],
    configurationDescription?: string,
    latestRevision?: CfnConfiguration.LatestRevisionProperty) : CfnConfiguration {

    let versions: string[] = [];

    kafkaVersions.forEach((kafkaVersion: KafkaVersion) => { versions.push(kafkaVersion.version); });

    const data = readFileSync(serverPropertiesFilePath, 'utf8');

    return new CfnConfiguration(scope, id, {
      name: name,
      serverProperties: data,
      kafkaVersionsList: versions,
      description: configurationDescription,
      latestRevision: latestRevision,
    });

  }

  public readonly mskProvisionedCluster: CfnCluster;

  private readonly removalPolicy: RemovalPolicy;
  private readonly mskAclAdminProviderToken: string;
  private readonly account: string;
  private readonly region: string;
  private readonly mskBrokerinstanceType: MskBrokerInstanceType;
  private readonly vpc: IVpc;
  private readonly subnetSelectionIds: string[];
  private readonly connections: Connections;
  private readonly numberOfBrokerNodes: number;
  private readonly tlsCertifacateSecret: ISecret;
  private readonly kafkaClientLogLevel: string;

  /**
     * Constructs a new instance of the EmrEksCluster construct.
     * @param {Construct} scope the Scope of the CDK Construct
     * @param {string} id the ID of the CDK Construct
     * @param {MskServerlessProps} props
     */
  constructor(scope: Construct, id: string, props: MskProvisionedProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MskProvisioned.name,
    };

    super(scope, id, trackedConstructProps);

    this.account = Stack.of(this).account;
    this.region = Stack.of(this).region;
    this.tlsCertifacateSecret = props.certificateDefinition.secretCertificate;
    this.kafkaClientLogLevel = props.kafkaClientLogLevel ?? KafkaClientLogLevel.INFO;

    console.log(this.account + this.region);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    if (!props.vpc) {
      this.vpc = new DataVpc(scope, 'Vpc', {
        vpcCidr: '10.0.0.0/16',
      }).vpc;
    } else {
      this.vpc = props.vpc;
    }

    //if vpcSubnets is pass without VPC throw error or if vpc is passed without vpcSubnets throw error
    if (props.vpcSubnets && !props.vpc || !props.vpcSubnets && props.vpc) {
      throw new Error('Need to pass both vpcSubnets and vpc');
    } else if (props.vpcSubnets) {
      this.subnetSelectionIds = this.vpc.selectSubnets(props.vpcSubnets).subnetIds;
    } else {
      this.subnetSelectionIds = this.vpc.privateSubnets.map((subnet) => subnet.subnetId);
    }

    this.connections = new Connections({
      securityGroups: props.securityGroups ?? [
        new SecurityGroup(this, 'SecurityGroup', {
          description: 'MSK security group',
          vpc: this.vpc,
        }),
      ],
    });

    const volumeSize = props.ebsStorageInfo?.volumeSize ?? 100;
    // Minimum: 1 GiB, maximum: 16384 GiB
    if (volumeSize < 1 || volumeSize > 16384) {
      throw Error(
        'EBS volume size should be in the range 1-16384',
      );
    }

    const encryptionAtRest = props.ebsStorageInfo?.encryptionKey
      ? {
        dataVolumeKmsKeyId:
          props.ebsStorageInfo.encryptionKey.keyId,
      }
      : undefined;


    this.mskBrokerinstanceType = props.mskBrokerinstanceType ?? MskBrokerInstanceType.KAFKA_M5_LARGE;

    const openMonitoring =
      props.monitoring?.enablePrometheusJmxExporter ||
        props.monitoring?.enablePrometheusNodeExporter
        ? {
          prometheus: {
            jmxExporter: props.monitoring?.enablePrometheusJmxExporter
              ? { enabledInBroker: true }
              : undefined,
            nodeExporter: props.monitoring
              ?.enablePrometheusNodeExporter
              ? { enabledInBroker: true }
              : undefined,
          },
        }
        : undefined;

    let clientAuthentication = clientAuthenticationSetup(props.clientAuthentication);

    let loggingInfo: CfnCluster.LoggingInfoProperty = monitoringSetup(this, id, this.removalPolicy, props.logging);

    //check the number of broker vs the number of AZs, it needs to be multiple
    this.numberOfBrokerNodes = props.numberOfBrokerNodes ?? 3;

    if (this.numberOfBrokerNodes % this.subnetSelectionIds.length) {
      throw Error('The number of broker nodes needs to be multiple of the number of AZs');
    }

    this.mskProvisionedCluster = new CfnCluster(this, 'mskProvisionedCluster', {
      clusterName: props.clusterName,
      kafkaVersion: props.kafkaVersion.version,
      numberOfBrokerNodes: this.numberOfBrokerNodes ?? 3,
      brokerNodeGroupInfo: {
        instanceType: `kafka.${this.mskBrokerinstanceType.instance.toString()}`,
        clientSubnets: this.subnetSelectionIds,
        securityGroups: this.connections.securityGroups.map(
          (group) => group.securityGroupId,
        ),
        storageInfo: {
          ebsStorageInfo: {
            volumeSize: volumeSize,
          },
        },
      },
      encryptionInfo: {
        encryptionAtRest,
        encryptionInTransit: {
          inCluster: true,
          clientBroker: 'TLS',
        },
      },
      enhancedMonitoring: props.monitoring?.clusterMonitoringLevel,
      openMonitoring: openMonitoring,
      storageMode: props.storageMode,
      loggingInfo: loggingInfo,
      clientAuthentication: clientAuthentication,
    });

    this.mskProvisionedCluster.applyRemovalPolicy(this.removalPolicy);


    //The section below address a best practice to change the zookeper security group
    //To an indepenedent one
    //https://docs.aws.amazon.com/msk/latest/developerguide/zookeeper-security.html

    //The policy allowing to get zookeeper connection string
    //List the ENIs associated to the zookeeper
    //and get the security group associated to them
    //And change the zookeeper security group

    let zooKeeperSecurityGroup: SecurityGroup = new SecurityGroup(this, 'ZookeeperSecurityGroup', {
      allowAllOutbound: false,
      vpc: this.vpc,
    });
    
    const lambdaPolicy = [
      new PolicyStatement({
        actions: ['kafka:DescribeCluster'],
        resources: [
          this.mskProvisionedCluster.attrArn,
        ],
      }),
      new PolicyStatement({
        actions: ['ec2:DescribeNetworkInterfaces'],
        resources: ['*'],
        conditions: {
          "StringEquals": {
            "ec2:Region": [
              Stack.of(this).region
            ]
          }
        }
      }),
      new PolicyStatement({
        actions: ['ec2:ModifyNetworkInterfaceAttribute'],
        resources: ['*'],
        conditions: {
          "StringEquals": {
            "ec2:Region": [
              Stack.of(this).region,
            ]
          },
          "ArnEquals": {
            "ec2:Vpc": this.vpc.vpcArn,
          }
        }
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'ZookeeperUpdateLambdaExecutionRolePolicy', {
      statements: lambdaPolicy,
      description: 'Policy for modifying security group for MSK zookeeper',
    });

    const zookeeperLambdaSecurityGroup = new SecurityGroup(this, 'ZookeeperUpdateLambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    const vpcPolicyLambda: ManagedPolicy = this.getVpcPermissions (
      zookeeperLambdaSecurityGroup, 
      this.subnetSelectionIds,
      'vpcPolicyLambdaUpdateZookeeperSg');

    //To be scoped down
    let lambdaRole: Role = new Role(this, 'ZookeeperUpdateLambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(lambdaExecutionRolePolicy);
    lambdaRole.addManagedPolicy(vpcPolicyLambda);

    let zookeeperUpdateLambdaLog = this.createLogGroup('zookeeperLambdaLogGroup');

    zookeeperUpdateLambdaLog.grantWrite(lambdaRole);

    const func = new Function(this, 'UpdateZookeeperSg', {
      handler: 'index.onEventHandler',
      code: Code.fromAsset(join(__dirname, './resources/lambdas/zooKeeperSecurityGroupUpdate')),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        MSK_CLUSTER_ARN: this.mskProvisionedCluster.attrArn,
        REGION: this.region,
        VPC_ID: this.vpc.vpcId,
        SECURITY_GROUP_ID: zooKeeperSecurityGroup.securityGroupId,
      },
      role: lambdaRole,
      timeout: Duration.seconds(30),
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
      logGroup: zookeeperUpdateLambdaLog,
      securityGroups: [zookeeperLambdaSecurityGroup],
    });

    new Trigger(this, 'UpdateZookeeperSgTrigger', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [this.mskProvisionedCluster],
    });

    //Configure the CR for applying ACLs
    //CR will also handle topic creation
    this.mskAclAdminProviderToken = mskAclAdminProviderSetup(
      this,
      this.removalPolicy,
      this.vpc,
      this.mskProvisionedCluster,
      this.connections.securityGroups[0],
    ).serviceToken;

    //Update cluster configuration as a last step before handing the cluster to customer.
    // Create the configuration


    let clusterConfigurationInfo: ClusterConfigurationInfo;

    if (!props.configurationInfo) {

      let clusterConfiguration: CfnConfiguration =
      MskProvisioned.createCLusterConfiguration(
        this, 'DsfclusterConfig',
        'dsfconfig',
        join(__dirname, './resources/cluster-config-msk-provisioned'),
        [props.kafkaVersion],
      );

      clusterConfigurationInfo = {
        arn: clusterConfiguration.attrArn,
        revision: clusterConfiguration.attrLatestRevisionRevision
      };

    } else {
      clusterConfigurationInfo = props.configurationInfo;
    }

    if (!props.allowEveryoneIfNoAclFound) {

      const crAcls: CustomResource [] =
      this.setAcls (props);

      this.setClusterConfiguration(this, this.mskProvisionedCluster, clusterConfigurationInfo, crAcls);
    }


  }


  //ACL operations through cli are defined here
  // https://jaceklaskowski.gitbooks.io/apache-kafka/content/kafka-admin-AclCommand.html
  // https://cwiki.apache.org/confluence/display/KAFKA/Kafka+Authorization+Command+Line+Interface
  public setAcl(
    scope: Construct,
    id: string,
    aclDefinition: Acl,
  ): CustomResource {

    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskAclAdminProviderToken,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret.secretArn,
        region: Stack.of(scope).region,
        mskClusterArn: this.mskProvisionedCluster.attrArn,
        resourceType: aclDefinition.resourceType,
        resourcePatternType: aclDefinition.resourcePatternType,
        resourceName: aclDefinition.resourceName,
        principal: aclDefinition.principal,
        host: aclDefinition.host,
        operation: aclDefinition.operation,
        permissionType: aclDefinition.permissionType,
      },
      resourceType: 'Custom::MskAcl',
    });

    cr.node.addDependency(this.mskProvisionedCluster);

    return cr;
  }

  /**
     * Creates a topic in the Msk Cluster
     *
     * @param {Construct} scope the scope of the stack where Topic will be created
     * @param {string} id the CDK id for Topic
     * @param {MskTopic []} topicDefinition the Kafka topic definition
     * @param {RemovalPolicy} removalPolicy Wether to keep the topic or delete it when removing the resource from the Stack {@default RemovalPolicy.RETAIN}
     * @param {boolean} waitForLeaders If this is true it will wait until metadata for the new topics doesn't throw LEADER_NOT_AVAILABLE
     * @param {number} timeout The time in ms to wait for a topic to be completely created on the controller node @default 5000
     */

  public setTopic(
    scope: Construct,
    id: string,
    topicDefinition: MskTopic[],
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskAclAdminProviderToken,
      properties: {
        topics: topicDefinition,
        waitForLeaders: waitForLeaders,
        timeout: timeout,
        region: Stack.of(scope).region,
        mskClusterArn: this.mskProvisionedCluster,
      },
      resourceType: 'Custom::MskTopic',
      removalPolicy: removalPolicy ?? RemovalPolicy.RETAIN,
    });

    cr.node.addDependency(this.mskProvisionedCluster);
  }

  /**
     * Grant a principal to produce data to a topic
     *
     * @param {string} topicName the topic to which the principal can produce data
     * @param {IPrincipal} principal the IAM principal to grand the produce to
     */
  public grantProduce(topicName: string, principal: IPrincipal) {

    console.log(topicName);
    console.log(principal);

  }

  /**
     * Grant a principal the right to consume data from a topic
     *
     * @param {string} topicName the topic to which the principal can consume data from.
     * @param {IPrincipal} principal the IAM principal to grand the consume action.
     */
  public grantConsume(topicName: string, principal: IPrincipal) {

    console.log(topicName);
    console.log(principal);

  }

  private setAcls (props: MskProvisionedProps): CustomResource [] {

    let aclsResources: CustomResource[] = [];
    console.log(props.clusterName);

    aclsResources.push(
      this.setAcl(this, 'aclOperation', {
        resourceType: AclResourceTypes.CLUSTER,
        resourceName: 'kafka-cluster',
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: props.certificateDefinition.aclAdminPrincipal,
        host: '*',
        operation: AclOperationTypes.ALTER,
        permissionType: AclPermissionTypes.ALLOW,
      },
      ));

    aclsResources.push(
      this.setAcl(this, 'aclBroker', {
        resourceType: AclResourceTypes.CLUSTER,
        resourceName: 'kafka-cluster',
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: 'REPLACE-WITH-BOOTSTRAP',
        host: '*',
        operation: AclOperationTypes.CLUSTER_ACTION,
        permissionType: AclPermissionTypes.ALLOW,
      },
      ));

    return aclsResources;

  }

  private setClusterConfiguration (scope: Construct, cluster: CfnCluster, configuration: ClusterConfigurationInfo
    , aclsResources: CustomResource []) {
    //Need to add trigger after set ACl is finalized
    //console.log(aclsResources);

    const setClusterConfigurationLambdaSecurityGroup = new SecurityGroup(this, 'setClusterConfigurationLambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    const vpcPolicyLambda: ManagedPolicy = this.getVpcPermissions(
      setClusterConfigurationLambdaSecurityGroup, 
      this.subnetSelectionIds, 
      'vpcPolicyLambdaSetClusterConfiguration');

    const lambdaPolicy = [
      new PolicyStatement({
        actions: ['kafka:DescribeCluster'],
        resources: [
          cluster.attrArn,
        ],
      }),
      new PolicyStatement({
        actions: ['kafka:DescribeConfiguration'],
        resources: [
          configuration.arn,
        ],
      }),
      new PolicyStatement({
        actions: ['kafka:UpdateConfiguration'],
        resources: [
          configuration.arn,
          cluster.attrArn,
        ],
      })
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'LambdaExecutionRolePolicyUpdateConfiguration', {
      statements: lambdaPolicy,
      description: 'Policy for Updating configuration of MSK cluster',
    });

    const lambdaCloudwatchLogUpdateConfiguration = this.createLogGroup('LambdaCloudwatchLogUpdateConfiguration');


    //TO be scoped down
    let lambdaRole: Role = new Role(this, 'LambdaExecutionRoleUpdateConfiguration', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(vpcPolicyLambda);
    lambdaRole.addManagedPolicy(lambdaExecutionRolePolicy);
    lambdaCloudwatchLogUpdateConfiguration.grantWrite(lambdaRole);

    const func = new Function(this, 'updateConfiguration', {
      handler: 'index.onEventHandler',
      code: Code.fromAsset(join(__dirname, './resources/lambdas/updateConfiguration')),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        MSK_CONFIGURATION_ARN: configuration.arn,
        MSK_CLUSTER_ARN: cluster.attrArn,
      },
      role: lambdaRole,
      timeout: Duration.seconds(20),
      logGroup: lambdaCloudwatchLogUpdateConfiguration,
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
      securityGroups: [setClusterConfigurationLambdaSecurityGroup],
    });

    new Trigger(this, 'UpdateMskConfiguration', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [...aclsResources],
    });

  }

  private getVpcPermissions(securityGroup: SecurityGroup, subnets: string[], id: string): ManagedPolicy {

    const securityGroupArn = `arn:aws:ec2:${this.region}:${this.account}:security-group/${securityGroup.securityGroupId}`;
    const subnetArns = subnets.map(s => `arn:aws:ec2:${this.region}:${this.account}:subnet/${s}`);

    const lambdaVpcPolicy = new ManagedPolicy(this, id, {
      statements: [
        new PolicyStatement({
          actions: [
            'ec2:DescribeNetworkInterfaces',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
          conditions: {
            StringEquals: {
              'aws:RequestedRegion': this.region,
            },
          },
        }),
        new PolicyStatement({
          actions: [
            'ec2:DeleteNetworkInterface',
            'ec2:AssignPrivateIpAddresses',
            'ec2:UnassignPrivateIpAddresses',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
          conditions: {
            StringEqualsIfExists: {
              'ec2:Subnet': subnetArns,
            },
          },
        }),
        new PolicyStatement({
          actions: [
            'ec2:CreateNetworkInterface',
          ],
          effect: Effect.ALLOW,
          resources: [
            `arn:aws:ec2:${this.region}:${this.account}:network-interface/*`,
          ].concat(subnetArns, securityGroupArn),
        }),
      ],
    });
    return lambdaVpcPolicy;
  }

  private createLogGroup(id: string) : ILogGroup {

    const logGroup: LogGroup = new LogGroup (this, id, {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: this.removalPolicy,
    });

    return logGroup;
  }

}