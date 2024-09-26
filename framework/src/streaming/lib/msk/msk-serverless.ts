// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, CustomResource, RemovalPolicy, Aws } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { CfnClusterPolicy, CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { KafkaApi } from './kafka-api';
import { addClusterPolicy } from './msk-helpers';
import { MskServerlessProps } from './msk-serverless-props';
import { Authentication, MskClusterType, MskTopic, ClientAuthentication, KafkaClientLogLevel } from './msk-utils';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A construct to create an MSK Serverless cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 *
 * const msk = new dsf.streaming.MskServerless(this, 'cluster');
 */
export class MskServerless extends TrackedConstruct {

  /**
   * The MSK cluster as a CloudFormation resource
   */
  public readonly cluster: CfnServerlessCluster;
  /**
   * The VPC where the MSK cluster is deployed
   */
  public readonly vpc: IVpc;
  /**
   * The security group used by the cluster
   */
  public readonly brokerSecurityGroup?: ISecurityGroup;
  /**
   * The name of the cluster
   */
  public readonly clusterName: string;
  /**
   * The security group used by the configuration Lambda
   */
  public readonly lambdaSecurityGroup: ISecurityGroup;

  /**
   * The list of bootstrap servers for client to connect
   */
  public readonly clusterBoostrapBrokers: string;

  /**
   * If there is an already existing service token deployed for the custom resource
   * you can reuse it to reduce the number of resource created
   */
  public readonly serviceToken?: string;

  private readonly removalPolicy: RemovalPolicy;
  private readonly kafkaApi: KafkaApi;


  /**
   * Constructs a new instance of the EmrEksCluster construct.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {MskServerlessProps} props
   */
  constructor(scope: Construct, id: string, props?: MskServerlessProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MskServerless.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);

    this.clusterName = props?.clusterName ?? 'default-msk-serverless';

    if (!props?.vpc) {
      this.vpc = new DataVpc(scope, 'Vpc', {
        vpcCidr: '10.0.0.0/16',
      }).vpc;
    } else {
      this.vpc = props.vpc;
    }

    let vpcConfigs;

    if (!props?.securityGroups) {
      this.brokerSecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
        vpc: this.vpc,
      });
    }

    let selectedSubnets :SubnetSelection;

    if (!props?.subnets) {
      selectedSubnets = this.vpc.selectSubnets();
    } else {
      selectedSubnets = this.vpc.selectSubnets(props.subnets);
    }

    vpcConfigs = [
      {
        subnetIds: selectedSubnets.subnets!.map((s) => s.subnetId),
        securityGroups: this.brokerSecurityGroup ? [this.brokerSecurityGroup.securityGroupId] : props?.securityGroups?.map((s)=> s.securityGroupId),
      },
    ];

    //Security group dedicated to lambda CR
    this.lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: false,
    });

    vpcConfigs[0].securityGroups!.push(this.lambdaSecurityGroup.securityGroupId);

    this.cluster = new CfnServerlessCluster(this, 'CfnServerlessCluster', {
      clusterName: this.clusterName,
      vpcConfigs: vpcConfigs,
      clientAuthentication: {
        sasl: {
          iam: {
            enabled: true,
          },
        },
      },
    });

    this.kafkaApi = new KafkaApi(this, 'KafkaApi', {
      vpc: this.vpc,
      clusterArn: this.cluster.attrArn,
      brokerSecurityGroup: this.lambdaSecurityGroup,
      removalPolicy: this.removalPolicy,
      clientAuthentication: ClientAuthentication.sasl( { iam: true }),
      clusterType: MskClusterType.SERVERLESS,
      kafkaClientLogLevel: props?.kafkaClientLogLevel ?? KafkaClientLogLevel.WARN,
    });

    this.serviceToken = this.kafkaApi.serviceToken;
    new CfnOutput(this, 'ServiceToken', {
      value: this.serviceToken!,
      exportName: `${Aws.STACK_NAME}-ServiceToken`,
    });

    const clusterBootstrapBrokers = new AwsCustomResource(this, 'BootstrapBrokersIam', {
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

    this.clusterBoostrapBrokers = clusterBootstrapBrokers.getResponseField('BootstrapBrokerStringSaslIam');
  }

  /**
   * Creates a topic in the MSK Serverless
   *
   * @param {string} id the CDK id for the topic
   * @param {MskTopic []} topicDefinition the Kafka topic definition
   * @param {RemovalPolicy} removalPolicy Wether to keep the topic or delete it when removing the resource from the Stack. @default - RemovalPolicy.RETAIN
   * @param {boolean} waitForLeaders Wait until metadata for the new topics doesn't throw LEADER_NOT_AVAILABLE
   * @param {number} timeout The time in ms to wait for a topic to be completely created on the controller node @default - 5000
   * @return the custom resource used to create the topic
   */

  public addTopic(
    id: string,
    topicDefinition: MskTopic,
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number): CustomResource {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = this.kafkaApi.setTopic(
      id,
      Authentication.IAM,
      topicDefinition,
      removalPolicy,
      waitForLeaders,
      timeout);

    cr.node.addDependency(this.cluster);
    return cr;
  }

  /**
   * Grant a principal to produce data to a topic
   *
   * @param {string} topicName the name of the topic to grant producer permissions
   * @param {IPrincipal} principal the IAM principal to grand producer permissions
   * @return the custom resource used to grant the producer permissions
   */
  public grantProduce(topicName: string, principal: IPrincipal): CustomResource | undefined {

    return this.kafkaApi.grantProduce(
      'N/A',
      topicName,
      Authentication.IAM,
      principal);
  }

  /**
   * Grant a principal the right to consume data from a topic
   *
   * @param {string} topicName the topic to which the principal can consume data from.
   * @param {IPrincipal} principal the IAM principal to grand the consume action.
   * @return the custom resource used to grant the consumer permissions
   */
  public grantConsume(topicName: string, principal: IPrincipal): CustomResource | undefined {

    return this.kafkaApi.grantConsume(
      'N/A',
      topicName,
      Authentication.IAM,
      principal);
  }


  /**
   * Add a cluster policy
   *
   * @param {PolicyDocument} policy the IAM principal to grand the consume action.
   * @param {string} id the CDK id for the Cluster Policy
   * @return {CfnClusterPolicy}
   */
  public addClusterPolicy (policy: PolicyDocument, id: string): CfnClusterPolicy {

    return addClusterPolicy(this, policy, id, this.cluster);
  }
}