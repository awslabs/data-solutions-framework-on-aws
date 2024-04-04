// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { join } from 'path';


import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, ISecurityGroup, IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { Code, Function, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { CfnCluster, CfnConfiguration } from 'aws-cdk-lib/aws-msk';

import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { InvocationType, Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';
import { KafkaApi } from './kafka-api';
import { clientAuthenticationSetup, createLogGroup, monitoringSetup, getVpcPermissions, updateClusterConnectivity } from './msk-provisioned-cluster-setup';
import { Acl, MskProvisionedProps } from './msk-provisioned-props';
import {
  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,
  KafkaVersion, MskBrokerInstanceType, ClusterConfigurationInfo, Authentitcation, ClientAuthentication, VpcClientAuthentication,
} from './msk-provisioned-props-utils';
import { MskTopic } from './msk-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';

/**
 * A construct to create an MSK Provisioned cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 *
 * const msk = new MskProvisioned(stack, 'cluster');
 *
 */
export class MskProvisioned extends TrackedConstruct {

  public static readonly MSK_DEFAULT_VERSION: KafkaVersion = KafkaVersion.V3_5_1;

  public static createCLusterConfiguration(
    scope: Construct,
    id: string,
    name: string,
    serverPropertiesFilePath: string,
    kafkaVersions: KafkaVersion[],
    configurationDescription?: string,
    latestRevision?: CfnConfiguration.LatestRevisionProperty): CfnConfiguration {

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
  /**
   * The MSK cluster created by the construct
   */
  public readonly cluster: CfnCluster;
  /**
   * The VPC created by the construct or the one passed to it
   */
  public readonly vpc: IVpc;
  /**
   * The connection string to brokers when using IAM authentication
   */
  public readonly bootstrapBrokerStringIam?: string;
  /**
   * The connection string to brokers when using TLS authentication
   */
  public readonly bootstrapBrokerStringTls?: string;
  /**
   * The KMS CMK key created by the construct for the brokers
   * When no KMS key is passed
   */
  public readonly brokerAtRestEncryptionKey: IKey;

  public readonly cloudwatchlogUpdateZookepeerLambda: ILogGroup;
  public readonly roleUpdateZookepeerLambda: IRole;
  public readonly securityGroupUpdateZookepeerLambda: ISecurityGroup;
  public readonly cloudwatchlogApplyConfigurationLambda?: ILogGroup;
  public readonly roleApplyConfigurationLambda?: IRole;
  public readonly securityGroupApplyConfigurationLambda?: ISecurityGroup;
  public readonly clusterConfiguration?: CfnConfiguration;
  public readonly brokerSecurityGroup?: ISecurityGroup;
  public readonly brokerCloudWatchLogGroup?: ILogGroup;

  public readonly mskIamACrudAdminCrLambdaRole?: IRole;
  public readonly mskIamACrudAdminCrOnEventHandlerLogGroup?: ILogGroup;
  public readonly mskIamACrudAdminCrOnEventHandlerFunction?: IFunction;
  public readonly mskIamACrudAdminCrSecurityGroup?: ISecurityGroup[];

  public readonly mskInClusterAclCrLambdaRole?: IRole;
  public readonly mskInClusterAclCrOnEventHandlerLogGroup?: ILogGroup;
  public readonly mskInClusterAclCrOnEventHandlerFunction?: IFunction;
  public readonly mskInClusterAclCrSecurityGroup?: ISecurityGroup[];

  public readonly updateConnectivityLambdaRole?: IRole;
  public readonly updateConnectivityLogGroup?: ILogGroup;
  public readonly updateConnectivityFunction?: Function;
  public readonly updateConnectivitySecurityGroup?: ISecurityGroup[];

  private readonly removalPolicy: RemovalPolicy;
  private readonly region: string;
  private readonly mskBrokerinstanceType: MskBrokerInstanceType;
  private readonly subnetSelectionIds: string[];
  private readonly connections: Connections;
  private readonly defaultNumberOfBrokerNodes: number;
  private readonly numberOfBrokerNodes: number;
  private readonly inClusterAcl: boolean;
  private readonly iamAcl: boolean;
  private readonly crPrincipal?: string;
  private aclOperationCr?: CustomResource;
  private aclDeleteTopic?: CustomResource;
  private aclCreateTopic?: CustomResource;
  private readonly deploymentClusterVersion;
  private readonly kafkaApi: KafkaApi;
  private readonly clusterVpcConnectivity?: VpcClientAuthentication;

  /**
     * Constructs a new instance of the EmrEksCluster construct.
     * @param {Construct} scope the Scope of the CDK Construct
     * @param {string} id the ID of the CDK Construct
     * @param {MskServerlessProps} props
     */
  constructor(scope: Construct, id: string, props?: MskProvisionedProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MskProvisioned.name,
    };

    super(scope, id, trackedConstructProps);

    this.region = Stack.of(this).region;

    if (props?.certificateDefinition) {
      this.crPrincipal = props.certificateDefinition.aclAdminPrincipal;
    }

    this.removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);

    if (!props?.vpc) {
      this.vpc = new DataVpc(scope, 'Vpc', {
        vpcCidr: '10.0.0.0/16',
      }).vpc;
    } else {

      if (!props.vpc.vpcId ||
        !props.vpc.vpcCidrBlock ||
        !props.vpc.availabilityZones ||
        !props.vpc.publicSubnets ||
        !props.vpc.privateSubnets) {
        throw Error('VPC requires the following attributes: "vpcId", "vpcCidrBlock", "availabilityZones", "publicSubnets", "privateSubnets" ');
      }

      this.vpc = props.vpc;
    }

    this.clusterVpcConnectivity = props?.vpcConnectivity;

    //if vpcSubnets is pass without VPC throw error or if vpc is passed without vpcSubnets throw error
    if (props?.vpcSubnets && !props?.vpc || !props?.vpcSubnets && props?.vpc) {
      throw new Error('Need to pass both vpcSubnets and vpc');
    } else if (props?.vpcSubnets) {
      this.subnetSelectionIds = this.vpc.selectSubnets(props.vpcSubnets).subnetIds;
    } else {
      this.subnetSelectionIds = this.vpc.privateSubnets.map((subnet) => subnet.subnetId);
    }

    this.connections = new Connections({
      securityGroups: props?.securityGroups ?? [
        this.brokerSecurityGroup = new SecurityGroup(this, 'SecurityGroup', {
          description: 'MSK security group',
          vpc: this.vpc,
          allowAllOutbound: true,
          disableInlineRules: false,
        }),
      ],
    });

    const volumeSize = props?.ebsStorageInfo?.volumeSize ?? 100;
    // Minimum: 1 GiB, maximum: 16384 GiB
    if (volumeSize < 1 || volumeSize > 16384) {
      throw Error(
        'EBS volume size should be in the range 1-16384',
      );
    }

    if (!props?.ebsStorageInfo?.encryptionKey) {

      this.brokerAtRestEncryptionKey = new Key(this, 'BrokerAtRestEncryptionKey', {
        enableKeyRotation: true,
        description: `Encryption key for MSK broker at rest for cluster ${props?.clusterName ?? 'default-msk-provisioned'}`,
        removalPolicy: this.removalPolicy,
      });

    } else {
      this.brokerAtRestEncryptionKey = props.ebsStorageInfo.encryptionKey;
    }

    const encryptionAtRest = {
      dataVolumeKmsKeyId:
        this.brokerAtRestEncryptionKey.keyId,
    };


    this.mskBrokerinstanceType = props?.mskBrokerinstanceType ?? MskBrokerInstanceType.KAFKA_M5_LARGE;

    const openMonitoring =
      props?.monitoring?.enablePrometheusJmxExporter ||
        props?.monitoring?.enablePrometheusNodeExporter
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

    this.inClusterAcl = false;
    this.iamAcl = false;

    let clientAuthentication: CfnCluster.ClientAuthenticationProperty;

    [clientAuthentication, this.inClusterAcl, this.iamAcl] = clientAuthenticationSetup(props?.clientAuthentication);

    let loggingInfo: CfnCluster.LoggingInfoProperty;

    [loggingInfo, this.brokerCloudWatchLogGroup] = monitoringSetup(this, id, this.removalPolicy, props?.logging);

    //check the number of broker vs the number of AZs, it needs to be multiple

    this.defaultNumberOfBrokerNodes = this.vpc.availabilityZones.length > 3 ? 3 : this.vpc.availabilityZones.length;
    this.numberOfBrokerNodes = props?.numberOfBrokerNodes ?? this.defaultNumberOfBrokerNodes;

    if (this.numberOfBrokerNodes % this.vpc.availabilityZones.length) {
      throw Error('The number of broker nodes needs to be multiple of the number of AZs');
    }

    this.deploymentClusterVersion = props?.kafkaVersion ?? MskProvisioned.MSK_DEFAULT_VERSION;

    this.cluster = new CfnCluster(this, 'mskProvisionedCluster', {
      clusterName: props?.clusterName ?? 'default-msk-provisioned',
      kafkaVersion: this.deploymentClusterVersion.version,
      numberOfBrokerNodes: this.numberOfBrokerNodes,
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
      enhancedMonitoring: props?.monitoring?.clusterMonitoringLevel,
      openMonitoring: openMonitoring,
      storageMode: props?.storageMode,
      loggingInfo: loggingInfo,
      clientAuthentication: clientAuthentication,
    });

    this.cluster.applyRemovalPolicy(this.removalPolicy);


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

    this.cluster.node.addDependency(zooKeeperSecurityGroup);

    const lambdaPolicy = [
      new PolicyStatement({
        actions: ['kafka:DescribeCluster'],
        resources: [
          this.cluster.attrArn,
        ],
      }),
      new PolicyStatement({
        actions: ['ec2:DescribeNetworkInterfaces'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'ec2:Region': [
              Stack.of(this).region,
            ],
          },
        },
      }),
      new PolicyStatement({
        actions: ['ec2:ModifyNetworkInterfaceAttribute'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'ec2:Region': [
              Stack.of(this).region,
            ],
          },
          ArnEquals: {
            'ec2:Vpc': this.vpc.vpcArn,
          },
        },
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'ZookeeperUpdateLambdaExecutionRolePolicy', {
      statements: lambdaPolicy,
      description: 'Policy for modifying security group for MSK zookeeper',
    });

    this.securityGroupUpdateZookepeerLambda = new SecurityGroup(this, 'ZookeeperUpdateLambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    this.cluster.node.addDependency(this.securityGroupUpdateZookepeerLambda);

    const vpcPolicyLambda: ManagedPolicy = getVpcPermissions(this,
      this.securityGroupUpdateZookepeerLambda,
      this.subnetSelectionIds,
      'vpcPolicyLambdaUpdateZookeeperSg');

    this.roleUpdateZookepeerLambda = new Role(this, 'ZookeeperUpdateLambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    this.roleUpdateZookepeerLambda.addManagedPolicy(lambdaExecutionRolePolicy);
    this.roleUpdateZookepeerLambda.addManagedPolicy(vpcPolicyLambda);

    this.cloudwatchlogUpdateZookepeerLambda = createLogGroup(this, 'zookeeperLambdaLogGroup', this.removalPolicy);

    this.cloudwatchlogUpdateZookepeerLambda.grantWrite(this.roleUpdateZookepeerLambda);

    const func = new Function(this, 'UpdateZookeeperSg', {
      handler: 'index.onEventHandler',
      code: Code.fromAsset(join(__dirname, './resources/lambdas/zooKeeperSecurityGroupUpdate')),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        MSK_CLUSTER_ARN: this.cluster.attrArn,
        REGION: this.region,
        VPC_ID: this.vpc.vpcId,
        SECURITY_GROUP_ID: zooKeeperSecurityGroup.securityGroupId,
      },
      role: this.roleUpdateZookepeerLambda,
      timeout: Duration.seconds(30),
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
      logGroup: this.cloudwatchlogUpdateZookepeerLambda,
      securityGroups: [this.securityGroupUpdateZookepeerLambda],
    });

    new Trigger(this, 'UpdateZookeeperSgTrigger', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [this.cluster],
    });

    this.kafkaApi = new KafkaApi(this, 'KafkaApi', {
      vpc: this.vpc,
      clusterName: this.cluster.clusterName,
      clusterArn: this.cluster.attrArn,
      certficateSecret: props?.certificateDefinition?.secretCertificate,
      brokerSecurityGroup: this.connections.securityGroups[0],
      clientAuthentication: props?.clientAuthentication ?? ClientAuthentication.sasl({ iam: true }),
      kafkaClientLogLevel: props?.kafkaClientLogLevel,
    });

    this.kafkaApi._initiallizeCluster(this.cluster);

    //Set the CR that will use IAM credentials
    // This will be used for CRUD on Topics
    if (this.iamAcl) {

      this.bootstrapBrokerStringIam = this.getBootstrapBrokers('BootstrapBrokerStringSaslIam');

      this.mskIamACrudAdminCrLambdaRole = this.kafkaApi.mskIamACrudAdminCrLambdaRole;
      this.mskIamACrudAdminCrOnEventHandlerLogGroup = this.kafkaApi.mskIamACrudAdminCrOnEventHandlerLogGroup;
      this.mskIamACrudAdminCrOnEventHandlerFunction = this.kafkaApi.mskIamACrudAdminCrOnEventHandlerFunction;
      this.mskIamACrudAdminCrSecurityGroup = this.kafkaApi.mskIamACrudAdminCrSecurityGroup;

    }

    //If TLS or SASL/SCRAM (once implemented)
    //Set up the CR that will set the ACL using the Certs or Username/Password
    if (clientAuthentication.tls) {

      if (!props?.certificateDefinition) {
        throw new Error('TLS Authentication requires a certificate definition');
      }

      this.bootstrapBrokerStringTls = this.getBootstrapBrokers('BootstrapBrokerStringTls');

      this.mskInClusterAclCrLambdaRole = this.kafkaApi.mskInClusterAclCrLambdaRole;
      this.mskInClusterAclCrOnEventHandlerLogGroup = this.kafkaApi.mskInClusterAclCrOnEventHandlerLogGroup;
      this.mskInClusterAclCrOnEventHandlerFunction = this.kafkaApi.mskInClusterAclCrOnEventHandlerFunction;
      this.mskInClusterAclCrSecurityGroup = this.kafkaApi.mskInClusterAclCrSecurityGroup;

      // Create the configuration
      let clusterConfigurationInfo: ClusterConfigurationInfo;

      if (!props.configurationInfo) {

        this.clusterConfiguration =
          MskProvisioned.createCLusterConfiguration(
            this, 'ClusterConfigDsf',
            //This must be unique to avoid failing the stack creation
            //If we create the construct twice
            //Name of a configuration is required
            `dsfconfiguration${Utils.generateHash(Stack.of(this).stackName).slice(0, 3)}`,
            join(__dirname, './resources/cluster-config-msk-provisioned'),
            [this.deploymentClusterVersion],
          );

        this.cluster.node.addDependency(this.clusterConfiguration);

        clusterConfigurationInfo = {
          arn: this.clusterConfiguration.attrArn,
          revision: this.clusterConfiguration.attrLatestRevisionRevision,
        };

      } else {

        clusterConfigurationInfo = props.configurationInfo;
      }

      //Update cluster configuration as a last step before handing the cluster to customer.
      //This will set `allow.everyone.if.no.acl.found` to `false`
      //And will allow the provide set ACLs for the lambda CR to do CRUD operations on MSK for ACLs and Topics
      const crAcls: CustomResource[] = this.setAcls(props);

      //We isolate this operation so that all subsqueent ACL operations add a dependency on this first one
      //This aclOperationCr allow the lambda to apply other ACLs.
      this.aclOperationCr = crAcls[1];
      this.aclDeleteTopic = crAcls[3];
      this.aclCreateTopic = crAcls[2];

      if (!props.allowEveryoneIfNoAclFound) {

        let trigger: Trigger;

        [this.cloudwatchlogApplyConfigurationLambda, this.roleApplyConfigurationLambda, this.securityGroupApplyConfigurationLambda, trigger]
          = this.setClusterConfiguration(this.cluster, clusterConfigurationInfo, crAcls, this.brokerAtRestEncryptionKey);

        //Update the connectivity of the cluster

        if (props?.vpcConnectivity) {
          [
            this.updateConnectivityFunction,
            this.updateConnectivityLambdaRole,
            this.updateConnectivityLogGroup,
            this.updateConnectivitySecurityGroup,
          ] =
            updateClusterConnectivity(
              this,
              this.cluster,
              this.vpc,
              this.subnetSelectionIds,
              this.removalPolicy,
              this.brokerAtRestEncryptionKey,
              props?.vpcConnectivity);

          new Trigger(this, 'UpdateVpcConnectivityTrigger', {
            handler: this.updateConnectivityFunction,
            timeout: Duration.minutes(10),
            invocationType: InvocationType.REQUEST_RESPONSE,
            executeAfter: [trigger],
          });
        }

      }
    }

  }


  /**
    * Creates a topic in the Msk Cluster
    *
    * @param {Construct} scope the scope of the stack where Topic will be created
    * @param {string} id the CDK id for Topic
    * @param {Acl} aclDefinition the Kafka Acl definition
    * @param {RemovalPolicy} removalPolicy Wether to keep the ACL or delete it when removing the resource from the Stack {@default RemovalPolicy.RETAIN}
    * @returns {CustomResource} The MskAcl custom resource created
    */
  public setAcl(
    scope: Construct,
    id: string,
    aclDefinition: Acl,
    removalPolicy?: RemovalPolicy,
  ): CustomResource {

    if (!this.inClusterAcl) {
      throw Error('Setting ACLs is only supported with TLS and SASL/SCRAM');
    }

    const cr = this.kafkaApi.setAcl(scope, id, aclDefinition, removalPolicy);

    if (aclDefinition.principal !== this.crPrincipal && this.inClusterAcl) {
      cr.node.addDependency(this.aclOperationCr!);
    }

    cr.node.addDependency(this.cluster);

    return cr;
  }

  /**
    * Creates a topic in the Msk Cluster
    *
    * @param {Construct} scope the scope of the stack where Topic will be created
    * @param {string} id the CDK id for Topic
    * @param {Authentitcation} clientAuthentication The client authentication to use when creating the Topic
    * @param {MskTopic} topicDefinition the Kafka topic definition
    * @param {RemovalPolicy} removalPolicy Wether to keep the topic or delete it when removing the resource from the Stack {@default RemovalPolicy.RETAIN}
    * @param {boolean} waitForLeaders If this is true it will wait until metadata for the new topics doesn't throw LEADER_NOT_AVAILABLE
    * @param {number} timeout The time in ms to wait for a topic to be completely created on the controller node @default 5000
    * @returns {CustomResource} The MskTopic custom resource created
    */
  public setTopic(
    scope: Construct,
    id: string,
    clientAuthentication: Authentitcation,
    topicDefinition: MskTopic,
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number): CustomResource {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = this.kafkaApi.setTopic(
      scope,
      id,
      clientAuthentication,
      topicDefinition,
      removalPolicy,
      waitForLeaders,
      timeout);

    if (this.inClusterAcl) {
      cr.node.addDependency(this.aclOperationCr!);
      cr.node.addDependency(this.aclDeleteTopic!);
      cr.node.addDependency(this.aclCreateTopic!);
    }

    cr.node.addDependency(this.cluster);

    return cr;
  }

  /**
    * Grant a principal to produce data to a topic
    * @param {string} id the CDK resource id
    * @param {string} topicName the topic to which the principal can produce data
    * @param {Authentitcation} clientAuthentication The client authentication to use when grant on resource
    * @param {IPrincipal | string } principal the IAM principal to grand the produce to
    * @param {string} host the host to which the principal can produce data.
    * @param {RemovalPolicy} removalPolicy
    * @returns When MTLS is used as authentication an ACL is created using the MskAcl Custom resource to write in the topic is created and returned,
    *          you can use it to add dependency on it.
    */
  public grantProduce(
    id: string,
    topicName: string,
    clientAuthentication: Authentitcation,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy): CustomResource | undefined {

    return this.kafkaApi.grantProduce(
      id,
      topicName,
      clientAuthentication,
      principal,
      host,
      removalPolicy,
    );
  }

  /**
    * Grant a principal the right to consume data from a topic
    *
    * @param {string} id the CDK resource id
    * @param {string} topicName the topic to which the principal can produce data
    * @param {Authentitcation} clientAuthentication The client authentication to use when grant on resource
    * @param {IPrincipal | string } principal the IAM principal to grand the produce to
    * @param {string} host the host to which the principal can produce data.
    * @param {RemovalPolicy} removalPolicy
    * @returns When MTLS is used as authentication an ACL is created using the MskAcl Custom resource to read from the topic is created and returned,
    *          you can use it to add dependency on it.
    */
  public grantConsume(
    id: string,
    topicName: string,
    clientAuthentication: Authentitcation,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy): CustomResource | undefined {

    return this.kafkaApi.grantConsume(
      id,
      topicName,
      clientAuthentication,
      principal,
      host,
      removalPolicy);
  }

  public putClusterPolicy(policy: string, id: string, currentVersion?: string) {

    if (!this.clusterVpcConnectivity) {
      throw Error('PutClusterPolicy is Vpc Connectiviy is not setup');
    }

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    let clusterBootstrapBrokers = new AwsCustomResource(this, `PutClusterPolicy${id}`, {
      onUpdate: {
        service: 'Kafka',
        action: 'putClusterPolicy',
        parameters: {
          ClusterArn: this.cluster.attrArn,
          CurrentVersion: currentVersion,
          Policy: policy,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.cluster.attrArn],
      }),
      installLatestAwsSdk: false,
    });

    clusterBootstrapBrokers.node.addDependency(this.cluster);

  }

  public deleteClusterPolicy() {

    if (!this.clusterVpcConnectivity) {
      throw Error('PutClusterPolicy is Vpc Connectiviy is not setup');
    }

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    let clusterBootstrapBrokers = new AwsCustomResource(this, 'DeleteClusterPolicy', {
      onUpdate: {
        service: 'Kafka',
        action: 'deleteClusterPolicy',
        parameters: {
          ClusterArn: this.cluster.attrArn,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.cluster.attrArn],
      }),
      installLatestAwsSdk: false,
    });

    clusterBootstrapBrokers.node.addDependency(this.cluster);

  }

  private setAcls(props: MskProvisionedProps): CustomResource[] {

    let aclsResources: CustomResource[] = [];

    //Set the ACL to allow the principal used by CR
    //to add other ACLs
    let aclOperation = this.setAcl(this, 'aclOperation', {
      resourceType: AclResourceTypes.CLUSTER,
      resourceName: 'kafka-cluster',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.aclAdminPrincipal,
      host: '*',
      operation: AclOperationTypes.ALTER,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    this.aclOperationCr = aclOperation;

    //Set the ACL to allow for the brokers

    let aclBroker = this.setAcl(this, 'aclBroker', {
      resourceType: AclResourceTypes.CLUSTER,
      resourceName: 'kafka-cluster',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: 'REPLACE-WITH-BOOTSTRAP',
      host: '*',
      operation: AclOperationTypes.CLUSTER_ACTION,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    //Set the ACL to allow the principal used by CR
    //to perform CRUD operations on Topics
    let aclTopicCreate = this.setAcl(this, 'aclTopicCreate', {
      resourceType: AclResourceTypes.TOPIC,
      resourceName: '*',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.aclAdminPrincipal,
      host: '*',
      operation: AclOperationTypes.CREATE,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    let aclTopicDelete = this.setAcl(this, 'aclTopicDelete', {
      resourceType: AclResourceTypes.TOPIC,
      resourceName: '*',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.aclAdminPrincipal,
      host: '*',
      operation: AclOperationTypes.DELETE,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    let aclTopicUpdate = this.setAcl(this, 'aclTopicUpdate', {
      resourceType: AclResourceTypes.TOPIC,
      resourceName: '*',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.aclAdminPrincipal,
      host: '*',
      operation: AclOperationTypes.ALTER_CONFIGS,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    //Set the ACL for Admin principal
    let adminAclCluster = this.setAcl(this, 'adminAclCluster', {
      resourceType: AclResourceTypes.CLUSTER,
      resourceName: 'kafka-cluster',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.adminPrincipal,
      host: '*',
      operation: AclOperationTypes.CLUSTER_ACTION,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    let adminAclTopic = this.setAcl(this, 'adminAclTopic', {
      resourceType: AclResourceTypes.TOPIC,
      resourceName: '*',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.adminPrincipal,
      host: '*',
      operation: AclOperationTypes.ALL,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );

    let adminAclGroup = this.setAcl(this, 'adminAclGroup', {
      resourceType: AclResourceTypes.GROUP,
      resourceName: '*',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: props.certificateDefinition!.adminPrincipal,
      host: '*',
      operation: AclOperationTypes.ALL,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    );


    aclBroker.node.addDependency(aclOperation);

    aclsResources.push(aclBroker);
    aclsResources.push(aclOperation);
    aclsResources.push(aclTopicCreate);
    aclsResources.push(aclTopicDelete);
    aclsResources.push(aclTopicUpdate);
    aclsResources.push(adminAclCluster);
    aclsResources.push(adminAclTopic);
    aclsResources.push(adminAclGroup);

    return aclsResources;

  }

  private setClusterConfiguration(
    cluster: CfnCluster,
    configuration: ClusterConfigurationInfo,
    aclsResources: CustomResource[],
    brokerAtRestEncryptionKey: IKey): [
      ILogGroup,
      IRole,
      ISecurityGroup,
      Trigger,
    ] {

    const setClusterConfigurationLambdaSecurityGroup = new SecurityGroup(this, 'setClusterConfigurationLambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    const vpcPolicyLambda: ManagedPolicy = getVpcPermissions(this,
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
        actions: ['kafka:UpdateClusterConfiguration'],
        resources: [
          configuration.arn,
          cluster.attrArn,
        ],
      }),
      new PolicyStatement({
        actions: ['kms:CreateGrant', 'kms:DescribeKey'],
        resources: [
          brokerAtRestEncryptionKey.keyArn,
        ],
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'LambdaExecutionRolePolicyUpdateConfiguration', {
      statements: lambdaPolicy,
      description: 'Policy for Updating configuration of MSK cluster',
    });

    const lambdaCloudwatchLogUpdateConfiguration = createLogGroup(this, 'LambdaCloudwatchLogUpdateConfiguration', this.removalPolicy);

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

    const trigger = new Trigger(this, 'UpdateMskConfiguration', {
      handler: func,
      timeout: Duration.minutes(10),
      invocationType: InvocationType.REQUEST_RESPONSE,
      executeAfter: [...aclsResources],
    });

    return [lambdaCloudwatchLogUpdateConfiguration, lambdaRole, setClusterConfigurationLambdaSecurityGroup, trigger];

  }

  private getBootstrapBrokers(responseField: string): string {
    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    let clusterBootstrapBrokers = new AwsCustomResource(this, `BootstrapBrokers${responseField}`, {
      onUpdate: {
        service: 'Kafka',
        action: 'getBootstrapBrokers',
        parameters: {
          ClusterArn: this.cluster.attrArn,
        },
        physicalResourceId: PhysicalResourceId.of('BootstrapBrokers'),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.cluster.attrArn],
      }),
      installLatestAwsSdk: false,
    });

    clusterBootstrapBrokers.node.addDependency(this.cluster);

    return clusterBootstrapBrokers.getResponseField(responseField);

  }

}