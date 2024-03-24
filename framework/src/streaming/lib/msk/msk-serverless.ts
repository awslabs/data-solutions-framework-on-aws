// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, RemovalPolicy, Stack, Fn } from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

import { Construct } from 'constructs';
import { mskIamCrudProviderSetup } from './msk-helpers';
import { MskServerlessProps, MskTopic } from './msk-serverless-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A construct to create an MSK Serverless cluster
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/
 *
 * @example
 */
export class MskServerless extends TrackedConstruct {

  public readonly mskServerlessCluster: CfnServerlessCluster;

  private readonly removalPolicy: RemovalPolicy;
  private readonly mskCrudProviderToken: string;
  private readonly account: string;
  private readonly region: string;


  /**
   * Constructs a new instance of the EmrEksCluster construct.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {MskServerlessProps} props
   */
  constructor(scope: Construct, id: string, props: MskServerlessProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MskServerless.name,
    };

    super(scope, id, trackedConstructProps);

    this.account = Stack.of(scope).account;
    this.region = Stack.of(scope).region;

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    //Security group dedicated to lambda CR
    const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: props.vpc,
    });

    props.vpcConfigs[0].securityGroups!.push(lambdaSecurityGroup.securityGroupId);

    this.mskServerlessCluster = new CfnServerlessCluster(this, 'CfnServerlessCluster', {
      clusterName: props.clusterName ?? 'dsfServerlessCluster',
      vpcConfigs: props.vpcConfigs,
      clientAuthentication: {
        sasl: {
          iam: {
            enabled: true,
          },
        },
      },
    });

    let mskCrudProvider = mskIamCrudProviderSetup(
      this,
      this.removalPolicy,
      props.vpc,
      this.mskServerlessCluster,
      lambdaSecurityGroup);

    this.mskCrudProviderToken = mskCrudProvider.serviceToken;

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

  public addTopic (
    scope: Construct,
    id: string,
    topicDefinition: MskTopic [],
    removalPolicy?: RemovalPolicy,
    waitForLeaders?: boolean,
    timeout?: number) {

    // Create custom resource with async waiter until the Amazon EMR Managed Endpoint is created
    const cr = new CustomResource(scope, id, {
      serviceToken: this.mskCrudProviderToken,
      properties: {
        topics: topicDefinition,
        waitForLeaders: waitForLeaders,
        timeout: timeout,
        region: Stack.of(scope).region,
        mskClusterArn: this.mskServerlessCluster.attrArn,
      },
      resourceType: 'Custom::MskTopic',
      removalPolicy: removalPolicy ?? RemovalPolicy.RETAIN,
    });

    cr.node.addDependency(this.mskServerlessCluster);
  }

  /**
   * Grant a principal to produce data to a topic
   *
   * @param {string} topicName the topic to which the principal can produce data
   * @param {IPrincipal} principal the IAM principal to grand the produce to
   */
  public grantProduce (topicName: string, principal: IPrincipal) {

    let clusterName = Fn.select(1, Fn.split('/', this.mskServerlessCluster.attrArn));
    let clusterUuid = Fn.select(1, Fn.split('/', this.mskServerlessCluster.attrArn));

    principal.addToPrincipalPolicy(new PolicyStatement({
      actions: [
        'kafka-cluster:Connect',
        'kafka-cluster:WriteDataIdempotently',
      ],
      resources: [
        this.mskServerlessCluster.attrArn,
      ],
    }));

    principal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: [
          'kafka-cluster:WriteData',
          'kafka-cluster:DescribeTopic',
        ],
        resources: [
          `arn:aws:kafka:${this.region}:${this.account}:topic/${clusterName}/${clusterUuid}/${topicName}`,
        ],
      }));
  }

  /**
   * Grant a principal the right to consume data from a topic
   *
   * @param {string} topicName the topic to which the principal can consume data from.
   * @param {IPrincipal} principal the IAM principal to grand the consume action.
   */
  public grantConsume (topicName: string, principal: IPrincipal) {

    let clusterName = Fn.select(1, Fn.split('/', this.mskServerlessCluster.attrArn));
    let clusterUuid = Fn.select(1, Fn.split('/', this.mskServerlessCluster.attrArn));

    principal.addToPrincipalPolicy(new PolicyStatement({
      actions: [
        'kafka-cluster:Connect',
      ],
      resources: [
        this.mskServerlessCluster.attrArn,
      ],
    }));

    principal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: [
          'kafka-cluster:ReadData',
          'kafka-cluster:DescribeTopic',
        ],
        resources: [
          `arn:aws:kafka:${this.region}:${this.account}:topic/${clusterName}/${clusterUuid}/${topicName}`,
        ],
      }));

    principal.addToPrincipalPolicy(
      new PolicyStatement({
        actions: [
          'kafka-cluster:AlterGroup',
          'kafka-cluster:DescribeGroup',
        ],
        resources: [
          `arn:aws:kafka:${this.region}:${this.account}:topic/${clusterName}/${clusterUuid}/*`,
        ],
      }));

  }
}