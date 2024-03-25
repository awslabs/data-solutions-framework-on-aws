// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { join } from 'path';


import { CustomResource, Duration, Names, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, IPrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CfnCluster, CfnConfiguration } from 'aws-cdk-lib/aws-msk';

import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { InvocationType, Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';
import { grantConsumeIam, grantProduceIam, mskAclAdminProviderSetup, mskIamCrudProviderSetup } from './msk-helpers';
import { clientAuthenticationSetup, monitoringSetup } from './msk-provisioned-cluster-setup';
import { Acl, KafkaClientLogLevel, MskProvisionedProps } from './msk-provisioned-props';
import {
  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,
  KafkaVersion, MskBrokerInstanceType, ClusterConfigurationInfo, Authentitcation,
} from './msk-provisioned-props-utils';
import { MskTopic } from './msk-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';

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

  public readonly mskProvisionedCluster: CfnCluster;
  public readonly vpc: IVpc;

  private readonly removalPolicy: RemovalPolicy;
  private readonly mskInClusterAclAdminProviderToken?: string;
  private readonly mskIamACrudAdminProviderToken?: string;
  private readonly account: string;
  private readonly region: string;
  private readonly partition: string;
  private readonly mskBrokerinstanceType: MskBrokerInstanceType;
  private readonly subnetSelectionIds: string[];
  private readonly connections: Connections;
  private readonly defaultNumberOfBrokerNodes: number;
  private readonly numberOfBrokerNodes: number;
  private readonly tlsCertifacateSecret?: ISecret;
  private readonly kafkaClientLogLevel: KafkaClientLogLevel;
  private readonly inClusterAcl: boolean;
  private readonly iamAcl: boolean;
  private readonly crPrincipal?: string;
  private aclOperationCr?: CustomResource;

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
    this.partition = Stack.of(this).partition;

    if (props.certificateDefinition) {
      this.tlsCertifacateSecret = props.certificateDefinition.secretCertificate;
      this.crPrincipal = props.certificateDefinition.aclAdminPrincipal;
    }
    this.kafkaClientLogLevel = props.kafkaClientLogLevel ?? KafkaClientLogLevel.INFO;
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
          allowAllOutbound: true,
          disableInlineRules: false,
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

    this.inClusterAcl = false;
    this.iamAcl = false;

    let clientAuthentication: CfnCluster.ClientAuthenticationProperty;

    [clientAuthentication, this.inClusterAcl, this.iamAcl] = clientAuthenticationSetup(props.clientAuthentication);

    let loggingInfo: CfnCluster.LoggingInfoProperty = monitoringSetup(this, id, this.removalPolicy, props.logging);

    //check the number of broker vs the number of AZs, it needs to be multiple

    this.defaultNumberOfBrokerNodes = this.vpc.availabilityZones.length > 3 ? 3 : this.vpc.availabilityZones.length;
    this.numberOfBrokerNodes = props.numberOfBrokerNodes ?? this.defaultNumberOfBrokerNodes;

    if (this.numberOfBrokerNodes % this.vpc.availabilityZones.length) {
      throw Error('The number of broker nodes needs to be multiple of the number of AZs');
    }

    this.mskProvisionedCluster = new CfnCluster(this, 'mskProvisionedCluster', {
      clusterName: props.clusterName,
      kafkaVersion: props.kafkaVersion.version,
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

    this.mskProvisionedCluster.node.addDependency(zooKeeperSecurityGroup);

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

    const zookeeperLambdaSecurityGroup = new SecurityGroup(this, 'ZookeeperUpdateLambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    this.mskProvisionedCluster.node.addDependency(zookeeperLambdaSecurityGroup);

    const vpcPolicyLambda: ManagedPolicy = this.getVpcPermissions(
      zookeeperLambdaSecurityGroup,
      this.subnetSelectionIds,
      'vpcPolicyLambdaUpdateZookeeperSg');

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

    //Set the CR that will use IAM credentials
    // This will be used for CRUD on Topics
    if (this.iamAcl) {
      this.mskIamACrudAdminProviderToken = mskIamCrudProviderSetup(
        this,
        this.removalPolicy,
        this.vpc,
        this.mskProvisionedCluster,
        this.connections.securityGroups[0],
      ).serviceToken;

    }

    //If TLS or SASL/SCRAM (once implemented)
    //Set up the CR that will set the ACL using the Certs or Username/Password
    if (clientAuthentication.tls) {

      if (!props.certificateDefinition) {
        throw new Error('TLS Authentication requires a certificate definition');
      }

      //Configure the CR for applying ACLs
      //CR will also handle topic creation
      this.mskInClusterAclAdminProviderToken = mskAclAdminProviderSetup(
        this,
        this.removalPolicy,
        this.vpc,
        this.mskProvisionedCluster,
        this.connections.securityGroups[0],
        props.certificateDefinition!.secretCertificate,
      ).serviceToken;

      // Create the configuration
      let clusterConfigurationInfo: ClusterConfigurationInfo;

      if (!props.configurationInfo) {

        let clusterConfiguration: CfnConfiguration =
          MskProvisioned.createCLusterConfiguration(
            this, 'ClusterConfigDsf',
            //This must be unique to avoid failing the stack creation
            //If we create the construct twice
            //Name of a configuration is required
            `dsfconfiguration${Utils.generateHash(Stack.of(this).stackName).slice(0, 3)}`,
            join(__dirname, './resources/cluster-config-msk-provisioned'),
            [props.kafkaVersion],
          );

        this.mskProvisionedCluster.node.addDependency(clusterConfiguration);

        clusterConfigurationInfo = {
          arn: clusterConfiguration.attrArn,
          revision: clusterConfiguration.attrLatestRevisionRevision,
        };

      } else {

        clusterConfigurationInfo = props.configurationInfo;
      }

      //Update cluster configuration as a last step before handing the cluster to customer.
      //This will set `allow.everyone.if.no.acl.found` to `false`
      //And will allow the provide set ACLs for the lambda CR to do CRUD operations on MSK for ACLs and Topics

      const crAcls: CustomResource[] = this.setAcls(props);

      this.aclOperationCr = crAcls[0];

      if (!props.allowEveryoneIfNoAclFound) {

        this.setClusterConfiguration(this.mskProvisionedCluster, clusterConfigurationInfo, crAcls);
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

    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskInClusterAclAdminProviderToken!,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret!.secretArn,
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
      removalPolicy: removalPolicy,
    });

    if (aclDefinition.principal !== this.crPrincipal && this.inClusterAcl) {
      cr.node.addDependency(this.aclOperationCr!);
    }

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
    clientAuthentication: Authentitcation,
    topicDefinition: MskTopic[],
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) {

    let serviceToken: string;

    if (clientAuthentication === Authentitcation.IAM) {
      serviceToken = this.mskIamACrudAdminProviderToken!;
    } else {
      serviceToken = this.mskInClusterAclAdminProviderToken!;
    }

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(scope, id, {
      serviceToken: serviceToken,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret?.secretArn,
        topics: topicDefinition,
        waitForLeaders: waitForLeaders,
        timeout: timeout,
        region: this.region,
        mskClusterArn: this.mskProvisionedCluster.attrArn,
      },
      resourceType: 'Custom::MskTopic',
      removalPolicy: removalPolicy ?? RemovalPolicy.RETAIN,
    });

    if (this.inClusterAcl) {
      cr.node.addDependency(this.aclOperationCr!);
    }

    cr.node.addDependency(this.mskProvisionedCluster);
  }

  /**
     * Grant a principal to produce data to a topic
     * @param {string} id the CDK resource id
     * @param {string} topicName the topic to which the principal can produce data
     * @param {IPrincipal | string } principal the IAM principal to grand the produce to
     * @param {string} host the host to which the principal can produce data.
     */
  public grantProduce(
    id: string,
    topicName: string,
    clientAuthentication: Authentitcation,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy) {

    if (clientAuthentication === Authentitcation.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantProduceIam(
        topicName,
        principal as IPrincipal,
        this.mskProvisionedCluster);

    } else {

      //Check if principal is not a string
      if (typeof principal !== 'string') {
        throw Error('principal must not be of type IPrincipal');
      }

      const cr = this.setAcl(this, id, {
        resourceType: AclResourceTypes.TOPIC,
        resourceName: topicName,
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: principal as string,
        host: host ?? '*',
        operation: AclOperationTypes.WRITE,
        permissionType: AclPermissionTypes.ALLOW,
      },
      removalPolicy ?? RemovalPolicy.DESTROY,
      );

      cr.node.addDependency(this.mskProvisionedCluster);
    }


  }

  /**
     * Grant a principal the right to consume data from a topic
     *
     * @param {string} id the CDK resource id
     * @param {string} topicName the topic to which the principal can produce data
     * @param {IPrincipal | string } principal the IAM principal to grand the produce to
     * @param {string} host the host to which the principal can produce data.
     *
     */
  public grantConsume(
    id: string,
    topicName: string,
    clientAuthentication: Authentitcation,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy) {

    if (clientAuthentication === Authentitcation.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantConsumeIam(
        topicName,
        principal as IPrincipal,
        this.mskProvisionedCluster);

    } else {

      //Check if principal is not a string
      if (typeof principal !== 'string') {
        throw Error('principal must not be of type IPrincipal');
      }

      const cr = this.setAcl(this, id, {
        resourceType: AclResourceTypes.TOPIC,
        resourceName: topicName,
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: principal as string,
        host: host ?? '*',
        operation: AclOperationTypes.READ,
        permissionType: AclPermissionTypes.ALLOW,
      },
      removalPolicy ?? RemovalPolicy.DESTROY,
      );

      cr.node.addDependency(this.mskProvisionedCluster);
    }
  }

  private setAcls(props: MskProvisionedProps): CustomResource[] {

    let aclsResources: CustomResource[] = [];
    console.log(props.clusterName);

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
    aclsResources: CustomResource[]) {

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
        actions: ['kafka:UpdateClusterConfiguration'],
        resources: [
          configuration.arn,
          cluster.attrArn,
        ],
      }),
    ];

    //Attach policy to IAM Role
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'LambdaExecutionRolePolicyUpdateConfiguration', {
      statements: lambdaPolicy,
      description: 'Policy for Updating configuration of MSK cluster',
    });

    const lambdaCloudwatchLogUpdateConfiguration = this.createLogGroup('LambdaCloudwatchLogUpdateConfiguration');

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

    const securityGroupArn = `arn:${this.partition}:ec2:${this.region}:${this.account}:security-group/${securityGroup.securityGroupId}`;
    const subnetArns = subnets.map(s => `arn:${this.partition}:ec2:${this.region}:${this.account}:subnet/${s}`);

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
            `arn:${Stack.of(this).partition}:ec2:${this.region}:${this.account}:network-interface/*`,
          ].concat(subnetArns, securityGroupArn),
        }),
      ],
    });
    return lambdaVpcPolicy;
  }

  private createLogGroup(id: string): ILogGroup {

    const logGroup: LogGroup = new LogGroup(this, id, {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: this.removalPolicy,
    });

    return logGroup;
  }

}