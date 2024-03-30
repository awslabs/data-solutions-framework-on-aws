// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, RemovalPolicy, Stack } from 'aws-cdk-lib';

import { IPrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnCluster, CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { KafkaApiProps } from './kafka-api-props';
import { grantConsumeIam, grantProduceIam, mskIamCrudProviderSetup, mskAclAdminProviderSetup } from './msk-helpers';
import { Acl, KafkaClientLogLevel } from './msk-provisioned-props';
import {
  AclOperationTypes, AclPermissionTypes, AclResourceTypes, ResourcePatternTypes,
  Authentitcation,
} from './msk-provisioned-props-utils';
import { MskTopic } from './msk-serverless-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A construct to create an MSK Serverless cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 */
export class KafkaApi extends TrackedConstruct {


  public readonly mskIamACrudAdminProviderToken?: string;
  public readonly mskInClusterAclAdminProviderToken?: string;

  private readonly removalPolicy: RemovalPolicy;
  private readonly kafkaClientLogLevel: KafkaClientLogLevel;
  private readonly tlsCertifacateSecret?: ISecret;
  private readonly clusterArn: string;
  private cluster?: CfnCluster | CfnServerlessCluster;


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
    this.kafkaClientLogLevel = props.kafkaClientLogLevel ?? KafkaClientLogLevel.INFO;
    this.clusterArn = props.clusterArn;
    this.tlsCertifacateSecret = props.certficateSecret;

    if (props.clientAuthentication.tlsProps) {

      this.mskInClusterAclAdminProviderToken = mskAclAdminProviderSetup(
        this,
        this.removalPolicy,
        props.vpc,
        props.brokerSecurityGroup,
        props.clusterArn,
        props.certficateSecret!,
      ).serviceToken;
    }

    if ( props.clientAuthentication.saslProps) {

      this.mskIamACrudAdminProviderToken = mskIamCrudProviderSetup(
        this,
        this.removalPolicy,
        props.vpc,
        props.brokerSecurityGroup,
        props.clusterArn,
        props.clusterName,
      ).serviceToken;

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

    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskInClusterAclAdminProviderToken!,
      properties: {
        logLevel: this.kafkaClientLogLevel,
        secretArn: this.tlsCertifacateSecret?.secretArn,
        region: Stack.of(scope).region,
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
      removalPolicy: removalPolicy,
    });

    // if (aclDefinition.principal !== this.crPrincipal && this.inClusterAcl) {
    //   cr.node.addDependency(this.aclOperationCr!);
    // }

    // cr.node.addDependency(this.mskProvisionedCluster);

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
    topicDefinition: MskTopic,
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) : CustomResource {

    let serviceToken: string;
    let region = Stack.of(scope).region;

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
        topics: [topicDefinition],
        waitForLeaders: waitForLeaders,
        timeout: timeout,
        region: region,
        mskClusterArn: this.clusterArn,
      },
      resourceType: 'Custom::MskTopic',
      removalPolicy: removalPolicy ?? RemovalPolicy.RETAIN,
    });

    // if (this.inClusterAcl) {
    //   cr.node.addDependency(this.aclOperationCr!);
    // }

    // cr.node.addDependency(this.mskProvisionedCluster);

    return cr;
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
    removalPolicy?: RemovalPolicy) : CustomResource | undefined {

    if (clientAuthentication === Authentitcation.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantProduceIam(
        topicName,
        principal as IPrincipal,
        this.cluster,
        this.clusterArn);

      return undefined;

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

      //   cr.node.addDependency(this.mskProvisionedCluster);

      return cr;
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
    removalPolicy?: RemovalPolicy) : CustomResource | undefined {

    if (clientAuthentication === Authentitcation.IAM) {

      //Check if principal is not a string
      if (typeof principal == 'string') {
        throw Error('principal must be of type IPrincipal not string');
      }

      grantConsumeIam(
        topicName,
        principal as IPrincipal,
        this.cluster);

      return undefined;

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

      //cr.node.addDependency(this.mskProvisionedCluster);

      return cr;
    }
  }

  /**
       * internal method only
       * @param cluster
       */
  public _initiallizeCluster (cluster: CfnServerlessCluster | CfnCluster) {
    this.cluster = cluster;
  }

}