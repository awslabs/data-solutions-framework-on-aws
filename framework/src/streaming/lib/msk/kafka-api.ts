// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, RemovalPolicy, Stack } from 'aws-cdk-lib';

import { ISecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, IRole } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { KafkaApiProps } from './kafka-api-props';
import { grantConsumeIam, grantProduceIam, mskIamCrudProviderSetup, mskAclAdminProviderSetup } from './msk-helpers';
import {
  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,
  Authentication, Acl, KafkaClientLogLevel, MskTopic,
  MskClusterType,
} from './msk-utils';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A construct to create an MSK Serverless cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 */
export class KafkaApi extends TrackedConstruct {

  /**
   * The IAM Role used by the Custom Resource provider when MSK is using IAM authentication
   */
  public readonly mskIamRole?: IRole;
  /**
   * The Cloudwatch Log Group used by the Custom Resource provider when MSK is using IAM authentication
   */
  public readonly mskIamLogGroup?: ILogGroup;
  /**
   * The Lambda function used by the Custom Resource provider when MSK is using IAM authentication
   */
  public readonly mskIamFunction?: IFunction;
  /**
   * The Security Group used by the Custom Resource provider when MSK is using IAM authentication
   */
  public readonly mskIamSecurityGroup?: ISecurityGroup [];

  /**
   * The IAM Role used by the Custom Resource provider when MSK is using mTLS authentication
   */
  public readonly mskAclRole?: IRole;
  /**
   * The Cloudwatch Log Group used by the Custom Resource provider when MSK is using mTLS authentication
   */
  public readonly mskAclLogGroup?: ILogGroup;
  /**
   * The Lambda function used by the Custom Resource provider when MSK is using mTLS authentication
   */
  public readonly mskAclFunction?: IFunction;
  /**
   * The Security Group used by the Custom Resource provider when MSK is using mTLS authentication
   */
  public readonly mskAclSecurityGroup?: ISecurityGroup [];

  private readonly mskAclServiceToken?: string;
  private readonly mskIamServiceToken?: string;
  private readonly removalPolicy: RemovalPolicy;
  private readonly kafkaClientLogLevel: KafkaClientLogLevel;
  private readonly tlsCertifacateSecret?: ISecret;
  private readonly clusterArn: string;
  private readonly clusterType: MskClusterType;

  /**
   * Constructs a new instance of the EmrEksCluster construct.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {MskServerlessProps} props
   */
  constructor(scope: Construct, id: string, props: KafkaApiProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: KafkaApi.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    this.kafkaClientLogLevel = props?.kafkaClientLogLevel ?? KafkaClientLogLevel.WARN;
    this.clusterArn = props.clusterArn;
    this.tlsCertifacateSecret = props.certficateSecret;
    this.clusterType = props.clusterType;

    if (!props.vpc.vpcId ||
      !props.vpc.vpcCidrBlock ||
      !props.vpc.availabilityZones ||
      !props.vpc.publicSubnets ||
      !props.vpc.privateSubnets) {
      throw Error ('VPC requires the following attributes: "vpcId", "vpcCidrBlock", "availabilityZones", "publicSubnets", "privateSubnets" ');
    }

    if (props.clientAuthentication.tlsProps?.certificateAuthorities) {

      const mskAclProvider = mskAclAdminProviderSetup(
        this,
        this.removalPolicy,
        props.vpc,
        props.subnets || props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
        props.brokerSecurityGroup,
        props.clusterArn,
        props.certficateSecret!,
        props.mtlsHandlerRole,
      );

      this.mskAclServiceToken = mskAclProvider.serviceToken;
      this.mskAclRole = mskAclProvider.onEventHandlerRole;
      this.mskAclLogGroup = mskAclProvider.onEventHandlerLogGroup;
      this.mskAclFunction = mskAclProvider.onEventHandlerFunction;
      this.mskAclSecurityGroup = mskAclProvider.securityGroups;
    }

    if ( props.clientAuthentication.saslProps?.iam) {

      const mskIamProvider = mskIamCrudProviderSetup(
        this,
        this.removalPolicy,
        props.vpc,
        props.subnets || props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
        props.brokerSecurityGroup,
        props.clusterArn,
        props.iamHandlerRole,
      );

      this.mskIamServiceToken = mskIamProvider.serviceToken;
      this.mskIamRole = mskIamProvider.onEventHandlerRole;
      this.mskIamLogGroup = mskIamProvider.onEventHandlerLogGroup;
      this.mskIamFunction = mskIamProvider.onEventHandlerFunction;
      this.mskIamSecurityGroup = mskIamProvider.securityGroups;
    }

  }

  /**
   * Creates a topic in the Msk Cluster
   * @param {string} id the CDK id for Topic
   * @param {Acl} aclDefinition the Kafka Acl definition
   * @param {RemovalPolicy} removalPolicy Wether to keep the ACL or delete it when removing the resource from the Stack. @default - RemovalPolicy.RETAIN
   * @returns {CustomResource} The MskAcl custom resource created
   */
  public setAcl(
    id: string,
    aclDefinition: Acl,
    removalPolicy?: RemovalPolicy,
  ): CustomResource {

    const cr = new CustomResource(this, id, {
      serviceToken: this.mskAclServiceToken!,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret?.secretArn,
        region: Stack.of(this).region,
        mskClusterArn: this.clusterArn,
        resourceType: aclDefinition.resourceType,
        resourcePatternType: aclDefinition.resourcePatternType,
        resourceName: aclDefinition.resourceName,
        principal: aclDefinition.principal,
        host: aclDefinition.host,
        operation: aclDefinition.operation,
        permissionType: aclDefinition.permissionType,
      },
      resourceType: 'Custom::MskAcl',
      removalPolicy: Context.revertRemovalPolicy(this, removalPolicy),
    });

    return cr;
  }

  /**
   * Creates a topic in the Msk Cluster
   * @param {string} id the CDK id for Topic
   * @param {Authentication} clientAuthentication The client authentication to use when creating the Topic
   * @param {MskTopic} topicDefinition the Kafka topic definition
   * @param {RemovalPolicy} removalPolicy Wether to keep the topic or delete it when removing the resource from the Stack. @default - RemovalPolicy.RETAIN
   * @param {boolean} waitForLeaders If this is true it will wait until metadata for the new topics doesn't throw LEADER_NOT_AVAILABLE
   * @param {number} timeout The time in ms to wait for a topic to be completely created on the controller node @default - 5000
   * @returns {CustomResource} The MskTopic custom resource created
   */
  public setTopic(
    id: string,
    clientAuthentication: Authentication,
    topicDefinition: MskTopic,
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) : CustomResource {

    let serviceToken: string;
    let region = Stack.of(this).region;

    if (this.clusterType === MskClusterType.SERVERLESS && topicDefinition.replicationFactor !== undefined) {
      // (topicDefinition.replicaAssignment !== undefined || topicDefinition.replicationFactor !== undefined)) {
      throw new Error("The topic definition is incorrect: MSK Serverless doesn't support replication factor and replication assignments");
    }

    if (clientAuthentication === Authentication.IAM) {
      serviceToken = this.mskIamServiceToken!;
    } else {
      serviceToken = this.mskAclServiceToken!;
    }

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(this, id, {
      serviceToken: serviceToken,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret?.secretArn,
        topic: topicDefinition,
        waitForLeaders: waitForLeaders,
        timeout: timeout,
        region: region,
        mskClusterArn: this.clusterArn,
        mskClusterType: this.clusterType,
      },
      resourceType: 'Custom::MskTopic',
      removalPolicy: Context.revertRemovalPolicy(this, removalPolicy),
    });

    return cr;
  }

  /**
   * Grant a principal to produce data to a topic
   * @param {string} id the CDK resource id
   * @param {string} topicName the topic to which the principal can produce data
   * @param {Authentitcation} clientAuthentication The client authentication to use when grant on resource
   * @param {IPrincipal | string } principal the IAM principal to grand the produce to
   * @param {string} host the host to which the principal can produce data. @default - * is used
   * @param {RemovalPolicy} removalPolicy the removal policy to apply to the grant. @default - RETAIN is used
   * @returns When MTLS is used as authentication an ACL is created using the MskAcl Custom resource to write in the topic is created and returned,
   *          you can use it to add dependency on it.
   */
  public grantProduce(
    id: string,
    topicName: string,
    clientAuthentication: Authentication,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy) : CustomResource | undefined {

    if (clientAuthentication === Authentication.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantProduceIam(
        topicName,
        principal as IPrincipal,
        this.clusterArn);

      return undefined;

    } else {

      //Check if principal is not a string
      if (typeof principal !== 'string') {
        throw Error('principal must not be of type IPrincipal');
      }

      const cr = this.setAcl(id, {
        resourceType: AclResourceTypes.TOPIC,
        resourceName: topicName,
        resourcePatternType: ResourcePatternTypes.LITERAL,
        principal: principal as string,
        host: host ?? '*',
        operation: AclOperationTypes.WRITE,
        permissionType: AclPermissionTypes.ALLOW,
      },
      Context.revertRemovalPolicy(this, removalPolicy),
      );

      return cr;
    }


  }

  /**
   * Grant a principal the right to consume data from a topic
   * @param {string} id the CDK resource id
   * @param {string} topicName the topic to which the principal can produce data
   * @param {Authentitcation} clientAuthentication The client authentication to use when grant on resource
   * @param {IPrincipal | string } principal the IAM principal to grand the produce to
   * @param {string} host the host to which the principal can produce data. @default - * is used
   * @param {RemovalPolicy} removalPolicy the removal policy to apply to the grant. @default - RETAIN is used
   * @returns When MTLS is used as authentication an ACL is created using the MskAcl Custom resource to read from the topic is created and returned,
   *          you can use it to add dependency on it.
   */
  public grantConsume(
    id: string,
    topicName: string,
    clientAuthentication: Authentication,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy) : CustomResource | undefined {

    if (clientAuthentication === Authentication.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantConsumeIam(
        topicName,
        principal as IPrincipal,
        this.clusterArn);

      return undefined;

    } else {

      //Check if principal is not a string
      if (typeof principal !== 'string') {
        throw Error('principal must not be of type IPrincipal');
      }

      const cr = this.setAcl(id,
        {
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

      return cr;
    }
  }
}