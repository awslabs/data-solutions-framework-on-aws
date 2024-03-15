// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { join } from 'path';


import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnCluster, CfnConfiguration } from 'aws-cdk-lib/aws-msk';

import { InvocationType, Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';
import { mskAclAdminProviderSetup } from './msk-helpers';
import { clientAuthenticationSetup, monitoringSetup } from './msk-provisioned-cluster-setup';
import { Acl, MskProvisionedProps } from './msk-provisioned-props';
import {

  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,

  KafkaVersion, MskBrokerInstanceType,

} from './msk-provisioned-props-utils';
import { MskTopic } from './msk-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';

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

    this.account = Stack.of(scope).account;
    this.region = Stack.of(scope).region;

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
      configurationInfo: props.configurationInfo,
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

    //The policy allowing the MskTopic custom resource to create call Msk for CRUD operations on topic
    const lambdaPolicy = [
      new PolicyStatement({
        actions: ['kafka:DescribeCluster'],
        resources: [
          this.mskProvisionedCluster.attrArn,
        ],
      }),
      new PolicyStatement({
        actions: ['ec2:*'],
        resources: ['*'],
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
      statements: lambdaPolicy,
      description: 'Policy for modifying security group for MSK zookeeper',
    });


    //TO be scoped down
    let lambdaRole: Role = new Role(scope, 'LambdaExecutionRole', {
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(lambdaExecutionRolePolicy);

    let zooKeeperSecurityGroup: SecurityGroup = new SecurityGroup(this, 'ZookeeperSecurityGroup', {
      allowAllOutbound: false,
      vpc: this.vpc,
    });

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
      timeout: Duration.seconds(20),
    });

    new Trigger(this, 'UpdateZookeeperSgTrigger', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [this.mskProvisionedCluster],
    });

    //CR place holder for applying ACLs
    this.mskAclAdminProviderToken = mskAclAdminProviderSetup(
      this,
      this.removalPolicy,
      this.vpc,
      this.mskProvisionedCluster,
      this.connections.securityGroups[0],
    ).serviceToken;

    //Update cluster configuration as a last step before handing the cluster to customer.

    // Create the configuration
    let clusterConfiguration: CfnConfiguration =
    MskProvisioned.createCLusterConfiguration(
      this, 'DsfclusterConfig',
      'dsfconfig',
      join(__dirname, './resources/cluster-config-msk-provisioned'),
      [KafkaVersion.V2_8_0, KafkaVersion.V2_8_1]);

    const crAcls: CustomResource [] =
    this.setAcls (props);

    this.setClusterConfiguration(this, this.mskProvisionedCluster, clusterConfiguration, crAcls);

  }


  //ACL operations through cli are defined here
  // https://jaceklaskowski.gitbooks.io/apache-kafka/content/kafka-admin-AclCommand.html
  // https://cwiki.apache.org/confluence/display/KAFKA/Kafka+Authorization+Command+Line+Interface
  public addAcl(
    scope: Construct,
    id: string,
    aclDefinition: Acl,
  ): CustomResource {

    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskAclAdminProviderToken,
      properties: {
        secretName: 'dsf/mskCert',
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

  public addTopic(
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

  public addAclAdminClient(
    scope: Construct,
    id: string,
    removalPolicy?: RemovalPolicy) {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskAclAdminProviderToken,
      properties: {
        region: Stack.of(scope).region,
        mskClusterArn: this.mskProvisionedCluster.attrArn,
      },
      resourceType: 'Custom::MskAdminAcl',
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
      this.addAcl(this, 'acl1', {
        resourceType: AclResourceTypes.CLUSTER,
        resourceName: 'kafka-cluster',
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: props.certificateDefinition.principal,
        host: '*',
        operation: AclOperationTypes.ALTER,
        permissionType: AclPermissionTypes.ALLOW,
      }));

    aclsResources.push(
      this.addAcl(this, 'acl2', {
        resourceType: AclResourceTypes.CLUSTER,
        resourceName: 'kafka-cluster',
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: 'REPLACE-WITH-BOOTSTRAP',
        host: '*',
        operation: AclOperationTypes.CLUSTER_ACTION,
        permissionType: AclPermissionTypes.ALLOW,
      }));

    return aclsResources;

  }

  public setClusterConfiguration (scope: Construct, cluster: CfnCluster, configuration: CfnConfiguration
    , aclsResources: CustomResource []) {
    //Need to add trigger after set ACl is finalized
    //console.log(aclsResources);

    const lambdaPolicy = [
      new PolicyStatement({
        actions: ['kafka:*'],
        resources: [
          cluster.attrArn,
          configuration.attrArn,
        ],
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicyUpdateConfiguration', {
      statements: lambdaPolicy,
      description: 'Policy for modifying security group for MSK zookeeper',
    });


    //TO be scoped down
    let lambdaRole: Role = new Role(scope, 'LambdaExecutionRoleUpdateConfiguration', {
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(lambdaExecutionRolePolicy);

    const func = new Function(this, 'updateConfiguration', {
      handler: 'index.onEventHandler',
      code: Code.fromAsset(join(__dirname, './resources/lambdas/updateConfiguration')),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        MSK_CONFIGURATION_ARN: configuration.attrArn,
        MSK_CLUSTER_ARN: cluster.attrArn,
      },
      role: lambdaRole,
      timeout: Duration.seconds(20),
    });

    new Trigger(this, 'UpdateMskConfiguration', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [configuration, ...aclsResources],
    });

  }

}