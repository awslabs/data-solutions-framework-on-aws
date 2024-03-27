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

  readonly vpcConfigs?: CfnServerlessCluster.VpcConfigProperty [];

  readonly vpc?: IVpc;
}


/**
 * Properties for the `MskTopic`
 * As defined in `ITopicConfig` in [KafkaJS](https://kafka.js.org/docs/admin) SDK
 */
export interface MskTopic {
  readonly topic: string;
  readonly numPartitions?: number; // default: -1 (uses broker `num.partitions` configuration)
  readonly replicationFactor?: number; // default: -1 (uses broker `default.replication.factor` configuration)
  readonly replicaAssignment?: {[key: string]: any}[]; // Example: [{ partition: 0, replicas: [0,1,2] }] - default: []
  readonly configEntries?: {[key: string]: any}[]; // Example: [{ name: 'cleanup.policy', value: 'compact' }] - default: []
}