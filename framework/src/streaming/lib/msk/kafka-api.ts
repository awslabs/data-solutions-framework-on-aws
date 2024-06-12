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
 * A construct to create a Kafka API admin client
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
   * Constructs a new instance of the Kafka API construct.
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
      !props.vpc?.availabilityZones ||
      !props.vpc?.privateSubnets) {
      throw Error ('VPC requires the following attributes: "vpcId", "availabilityZones", "privateSubnets" ');
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
   * Creates a ACL in the MSK Cluster
   * @param {string} id the CDK ID of the ACL
   * @param {Acl} aclDefinition the Kafka ACL definition
   * @param {RemovalPolicy} removalPolicy Wether to keep the ACL or delete it when removing the resource from the Stack. @default - RemovalPolicy.RETAIN
   * @param {Authentication} clientAuthentication The authentication used by the Kafka API admin client to create the ACL @default - Authentication.MTLS
   * @returns {CustomResource} The MskAcl custom resource created by the Kafka API admin client
   */
  public setAcl(
    id: string,
    aclDefinition: Acl,
    removalPolicy?: RemovalPolicy,
    clientAuthentication?: Authentication,
  ): CustomResource {

    let serviceToken: string;

    let customResourceAuthentication = clientAuthentication ?? Authentication.MTLS;

    if (customResourceAuthentication === Authentication.IAM) {
      if (!this.mskIamServiceToken) {
        throw Error('IAM Authentication is not supported for this cluster');
      }
      serviceToken = this.mskIamServiceToken!;
    } else {
      if (!this.mskAclServiceToken) {
        throw Error('MTLS Authentication is not supported for this cluster');
      }
      serviceToken = this.mskAclServiceToken!;
    }

    const cr = new CustomResource(this, id, {
      serviceToken: serviceToken,
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
   * Creates a topic in the MSK Cluster
   * @param {string} id the CDK ID for Topic
   * @param {Authentication} clientAuthentication The authentication used by the Kafka API admin client to create the topic
   * @param {MskTopic} topicDefinition the Kafka topic definition
   * @param {RemovalPolicy} removalPolicy Wether to keep the topic or delete it when removing the resource from the Stack. @default - RemovalPolicy.RETAIN
   * @param {boolean} waitForLeaders If set to true, waits until metadata for the new topics doesn't throw LEADER_NOT_AVAILABLE
   * @param {number} timeout The time in ms to wait for a topic to be completely created on the controller node @default - 5000
   * @returns {CustomResource} The MskTopic custom resource created by the Kafka API admin client
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
      throw new Error("The topic definition is incorrect: MSK Serverless doesn't support replication factor and replication assignments");
    }

    if (clientAuthentication === Authentication.IAM) {
      if (!this.mskIamServiceToken) {
        throw Error('IAM Authentication is not supported for this cluster');
      }
      serviceToken = this.mskIamServiceToken!;
    } else {
      if (!this.mskAclServiceToken) {
        throw Error('MTLS Authentication is not supported for this cluster');
      }
      serviceToken = this.mskAclServiceToken!;
    }

    // Create custom resource with async waiter until the MSK topic is created
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
   * Grant a principal permissions to produce to a topic
   * @param {string} id the CDK resource ID
   * @param {string} topicName the target topic to grant produce permissions on
   * @param {Authentication} clientAuthentication The authentication mode of the producer
   * @param {IPrincipal | string } principal the principal receiving grant produce permissions
   * @param {string} host the host of the producer. @default - * is used
   * @param {RemovalPolicy} removalPolicy the removal policy to apply to the grant. @default - RETAIN is used
   * @param {Authentication} customResourceAuthentication The authentication used by the Kafka API admin client to create the ACL @default - clientAuthentication (same authentication as the target producer)
   * @returns The MskAcl custom resource for MTLS clientAuthentication. Nothing for IAM clientAuthentication
   */
  public grantProduce(
    id: string,
    topicName: string,
    clientAuthentication: Authentication,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy,
    customResourceAuthentication?: Authentication,
  ) : CustomResource | undefined {


    let authentication = customResourceAuthentication == undefined ? clientAuthentication: customResourceAuthentication;

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
      authentication,
      );

      return cr;
    }
  }

  /**
   * Grant a principal permissions to consume from a topic
   * @param {string} id the CDK resource ID
   * @param {string} topicName the target topic to grant consume permissions on
   * @param {Authentication} clientAuthentication The authentication mode of the consumer
   * @param {IPrincipal | string } principal the principal receiveing grant consume permissions
   * @param {string} host the host of the consumer. @default - * is used
   * @param {RemovalPolicy} removalPolicy the removal policy to apply to the grant. @default - RETAIN is used
   * @param {Authentication} customResourceAuthentication The authentication used by the Kafka API admin client to create the ACL @default - clientAuthentication (same authentication as the target producer)
   * @returns The MskAcl custom resource for MTLS clientAuthentication. Nothing for IAM clientAuthentication
   */
  public grantConsume(
    id: string,
    topicName: string,
    clientAuthentication: Authentication,
    principal: IPrincipal | string,
    host?: string,
    removalPolicy?: RemovalPolicy,
    customResourceAuthentication?: Authentication,
  ) : CustomResource | undefined {

    let authentication = customResourceAuthentication == undefined ? clientAuthentication: customResourceAuthentication;

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
        authentication,
      );

      return cr;
    }
  }
}