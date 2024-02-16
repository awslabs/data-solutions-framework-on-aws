// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';

/**
 * Properties for the `MskServerlessCluster` construct
 */
export interface MskServerlessProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  readonly clusterName: string;

  readonly clientAuthentication: CfnServerlessCluster.ClientAuthenticationProperty;

  readonly vpcConfigs: CfnServerlessCluster.VpcConfigProperty [];

  readonly vpc: IVpc;
}


/**
 * Properties for the `MskTopic`
 */
export interface MskTopic {

  topic: string;
  numPartitions: number;     // default: -1 (uses broker `num.partitions` configuration)
  replicationFactor: number; // default: -1 (uses broker `default.replication.factor` configuration)
  replicaAssignment: {string:any}[];  // Example: [{ partition: 0, replicas: [0,1,2] }] - default: []
  configEntries: {string:any}[];       // Example: [{ name: 'cleanup.policy', value: 'compact' }] - default: []
}