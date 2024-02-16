// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

import { Construct } from 'constructs';
import { mskCrudProviderSetup } from './msk-helpers';
import { MskServerlessProps, MskTopic } from './msk-serverless-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A construct to create an EKS cluster, configure it and enable it with EMR on EKS
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Processing/spark-emr-containers-runtime
 *
 * @example
 */
export class MskServerless extends TrackedConstruct {

  public readonly mskServerlessCluster: CfnServerlessCluster;

  private readonly removalPolicy: RemovalPolicy;
  private readonly mskCrudProviderToken: string;


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

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    //Security group dedicated to lambda CR
    const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: props.vpc,
    });

    props.vpcConfigs[0].securityGroups!.push(lambdaSecurityGroup.securityGroupId);

    this.mskServerlessCluster = new CfnServerlessCluster(this, 'CfnServerlessCluster', {
      clusterName: props.clusterName ?? 'dsfServerlessCluster',
      vpcConfigs: props.vpcConfigs,
      clientAuthentication: props.clientAuthentication,
    });

    console.log(this.removalPolicy);

    let mskCrudProvider = mskCrudProviderSetup(
      this,
      this.removalPolicy,
      props.vpc,
      this.mskServerlessCluster,
      lambdaSecurityGroup);

    this.mskCrudProviderToken = mskCrudProvider.serviceToken;

  }


  public createTopic (scope: Construct, id: string, topicDefinition: MskTopic [], waitForLeaders: boolean, timeout: number) {

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
    });

    cr.node.addDependency(this.mskServerlessCluster);

    console.log(topicDefinition);
  }

  public deleteTopic (topicName: string) {
    console.log(topicName);
  }

  public grantProduce (topicName: string, principal: IPrincipal) {
    console.log(topicName);
    console.log(principal);
  }

  public grantConsume (topicName: string, principal: IPrincipal) {
    console.log(topicName);
    console.log(principal);
  }
}