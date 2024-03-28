// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

import { Construct } from 'constructs';
import { MskServerlessProps, MskTopic } from './msk-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { KafkaApi } from './kafka-api';
import { Authentitcation, ClientAuthentication } from './msk-provisioned-props-utils';

/**
 * A construct to create an MSK Serverless cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 */
export class MskServerless extends TrackedConstruct {

  public readonly mskServerlessCluster: CfnServerlessCluster;
  public readonly vpc: IVpc;
  public readonly brokerSecurityGroup?: ISecurityGroup;
  public readonly clusterName: string;

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

    if (props?.vpc && !props?.vpcConfigs || !props?.vpc && props?.vpcConfigs) {
      throw new Error('Need to pass both vpcConfigs and vpc');
    }

    let vpcConfigs;

    if (!props?.vpcConfigs) {

      this.brokerSecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
        vpc: this.vpc,
      });

      vpcConfigs = [
        {
          subnetIds: this.vpc.privateSubnets.map((s) => s.subnetId),
          securityGroups: [this.brokerSecurityGroup.securityGroupId],
        },
      ];
    } else {
      vpcConfigs = props.vpcConfigs;
    }

    //Security group dedicated to lambda CR
    const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: false,
    });

    vpcConfigs[0].securityGroups!.push(lambdaSecurityGroup.securityGroupId);

    this.mskServerlessCluster = new CfnServerlessCluster(this, 'CfnServerlessCluster', {
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

    //The select security group of brokers that will be used 
    //to allow the lambda of CR
    let brokerSecurityGroupCr;

    if (props?.vpcConfigs) {
      brokerSecurityGroupCr = SecurityGroup.fromSecurityGroupId(
        this, 
        'brokerSecurityGroup',
        props.vpcConfigs[0].securityGroups![0]);
    } else {
      brokerSecurityGroupCr = this.brokerSecurityGroup!;
    } 

    this.kafkaApi = new KafkaApi(this, 'KafkaApi', {
      vpc: this.vpc,
      clusterName: this.clusterName,
      clusterArn: this.mskServerlessCluster.attrArn,
      brokerSecurityGroup: brokerSecurityGroupCr!,
      removalPolicy: this.removalPolicy,
      clientAuthentication: ClientAuthentication.sasl( { iam: true}),
    });

    this.kafkaApi._initiallizeCluster(this.mskServerlessCluster);

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
    topicDefinition: MskTopic,
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = this.kafkaApi.setTopic(
      scope, 
      id,
      Authentitcation.IAM,
      topicDefinition,
      removalPolicy,
      waitForLeaders,
      timeout);

    cr.node.addDependency(this.mskServerlessCluster);
  }

  /**
   * Grant a principal to produce data to a topic
   *
   * @param {string} topicName the topic to which the principal can produce data
   * @param {IPrincipal} principal the IAM principal to grand the produce to
   */
  public grantProduce(topicName: string, principal: IPrincipal) {

    this.kafkaApi.grantProduce(
      'N/A',
      topicName,
      Authentitcation.IAM, 
      principal);

  }

  /**
   * Grant a principal the right to consume data from a topic
   *
   * @param {string} topicName the topic to which the principal can consume data from.
   * @param {IPrincipal} principal the IAM principal to grand the consume action.
   */
  public grantConsume(topicName: string, principal: IPrincipal) {

    this.kafkaApi.grantConsume(
      'N/A',
      topicName,
      Authentitcation.IAM, 
      principal);

  }
}