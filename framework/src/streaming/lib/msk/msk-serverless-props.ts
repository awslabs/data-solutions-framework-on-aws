// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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