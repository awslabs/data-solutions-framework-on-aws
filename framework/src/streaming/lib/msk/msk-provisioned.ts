// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { join } from 'path';


import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IVpc, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { IPrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnCluster, CfnConfiguration } from 'aws-cdk-lib/aws-msk';

import { Provider } from 'aws-cdk-lib/custom-resources';
import { InvocationType, Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';
import { mskCrudTlsProviderSetup } from './msk-helpers';
import { clientAuthenticationSetup, getZookeeperConnectionString, monitoringSetup } from './msk-provisioned-cluster-setup';
import { KafkaAclProp, MskProvisionedProps } from './msk-provisioned-props';
import { KafkaVersion, MskBrokerInstanceType } from './msk-provisioned-props-utils';
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
  private readonly mskCrudTlsProviderToken: string;
  private readonly mskAclProviderToken: string;
  private readonly account: string;
  private readonly region: string;
  private readonly mskBrokerinstanceType: MskBrokerInstanceType;
  private readonly vpc: IVpc;
  private readonly subnetSelectionIds: string[];
  private readonly connections: Connections;
  private readonly numberOfBrokerNodes: number;
  private readonly zookeeperConnectionString = { ZookeeperConnectStringTls: '', ZookeeperConnectString: '' };

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

    let loggingInfo: CfnCluster.LoggingInfoProperty = monitoringSetup(this, this.removalPolicy, props.logging);

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
      new PolicyStatement({
        actions: [
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
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
      allowAllOutbound: true,
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

    this.zookeeperConnectionString = getZookeeperConnectionString(this, this.mskProvisionedCluster);

    const aclShell = new Function(this, 'AclShellContainer', {
      handler: Handler.FROM_IMAGE,
      code: Code.fromAssetImage(
        join(__dirname, './resources/lambdas/aclShell'), {
          platform: Platform.LINUX_AMD64,
        }),
      runtime: Runtime.FROM_IMAGE,
      role: lambdaRole,
      timeout: Duration.minutes(7),
      vpc: this.vpc,
      memorySize: 256,
      environment: {
        ZK_CONNECTION_STRING: this.zookeeperConnectionString.ZookeeperConnectString,
        ZK_CONNECTION_STRING_TLS: this.zookeeperConnectionString.ZookeeperConnectStringTls,
      },
      securityGroups: [zooKeeperSecurityGroup],
      vpcSubnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    });

    //This need to be changed to a dedicated SG for lambda
    zooKeeperSecurityGroup.addIngressRule(zooKeeperSecurityGroup, Port.allTcp());

    this.mskAclProviderToken = new Provider(this, 'AclProvider', {
      onEventHandler: aclShell,
    }).serviceToken;


    //CR place holder for applying ACLs
    let mskCrudProvider = mskCrudTlsProviderSetup(
      this,
      this.removalPolicy,
      this.vpc,
      this.mskProvisionedCluster,
      zooKeeperSecurityGroup);

    this.mskCrudTlsProviderToken = mskCrudProvider.serviceToken;

    //Update cluster configuration as a last step before handing the cluster to customer.

    //Create the configuration
    let clusterConfiguration: CfnConfiguration | undefined = undefined;

    //= MskProvisioned.createCLusterConfiguration(this, 'DsfclusterConfig', 'dsf-msk-configuration', join(__dirname, './cluster-config-msk-provisioned'), [KafkaVersion.V2_8_0, KafkaVersion.V2_8_1]);

    const crAcls: CustomResource [] = this.setAcls ();

    this.setClusterConfiguration(this, this.mskProvisionedCluster, clusterConfiguration, crAcls);

  }


  //ACL operations through cli are defined here
  // https://jaceklaskowski.gitbooks.io/apache-kafka/content/kafka-admin-AclCommand.html
  // https://cwiki.apache.org/confluence/display/KAFKA/Kafka+Authorization+Command+Line+Interface
  public addAcl(
    scope: Construct,
    id: string,
    aclDefinition: KafkaAclProp,
  ): CustomResource {
    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskAclProviderToken,
      properties: {
        resourceType: aclDefinition.resourceType,
        resourceName: aclDefinition.resourceName,
        principal: aclDefinition.principal,
        host: aclDefinition.host,
        operation: aclDefinition.operation,
        permissionType: aclDefinition.permissionType,
        command: '',
      },
      resourceType: 'Custom::MskAcl',
    });

    cr.node.addDependency(this.mskProvisionedCluster);

    return cr;
  }

  /**
     * Creates a topic in the Msk Serverless
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
      serviceToken: this.mskCrudTlsProviderToken,
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

  private setAcls (): CustomResource [] {

    let aclsResources: CustomResource[] = [];
    //set Acls after updating the zookeeper
    // aclsResources.push(this.addAcl(this, 'AdminAcl', {
    //     resourceType: AclResourceTypes.TOPIC,
    //     resourceName: 'topic1',
    //     host: '*',
    //     principal: '',
    //     operation: AclOperationTypes.CREATE,
    //     permissionType: AclPermissionTypes.ALLOW,
    // }));

    return aclsResources;

  }

  private setClusterConfiguration (scope: Construct, cluster: CfnCluster, configuration?: CfnConfiguration, aclsResources?: CustomResource []) {
    //Need to add trigger after set ACl is finalized
    console.log(scope);
    console.log(cluster);
    console.log(configuration);
    console.log(aclsResources);

  }
}