// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IPrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

import { Construct } from 'constructs';
import { mskCrudProviderSetup } from './msk-helpers';
import { MskServerlessProps } from './msk-serverless-props';
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

    this.mskServerlessCluster = new CfnServerlessCluster(this, 'CfnServerlessCluster', {
      clusterName: props.clusterName ?? 'dsfServerlessCluster',
      vpcConfigs: props.vpcConfigs,
      clientAuthentication: props.clientAuthentication,
    });

    console.log(this.removalPolicy);

    mskCrudProviderSetup(this, this.removalPolicy, props.vpc, this.mskServerlessCluster);

  }


  public createTopic (topicName: string ) {
    console.log(topicName);
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