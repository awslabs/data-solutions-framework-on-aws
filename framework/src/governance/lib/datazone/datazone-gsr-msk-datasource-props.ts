// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';

/**
 * Properties for configuring a DataZone GSR MSK datasource.
 */
export interface DataZoneGsrMskDataSourceProps {
  /**
   * The name of the MSK (Managed Streaming for Apache Kafka) cluster to use.
   */
  readonly clusterName: string;

  /**
   * The unique identifier for the DataZone domain where the datasource resides.
   */
  readonly domainId: string;

  /**
   * The unique identifier for the project associated with this datasource.
   */
  readonly projectId: string;

  /**
   * The name of the registry for schema management.
   */
  readonly registryName: string;

  /**
   * The Role used by the Lambda responsible to manage DataZone MskTopicAssets
   * @default - A new role is created
   */
  readonly lambdaRole?: Role;

  /**
   * The cron schedule to run the data source and synchronize DataZone assets with the Glue Schema Registry.
   * The data source can be scheduled independently of the event based trigger configured with `enableSchemaRegistryEvent`.
   * @default - `cron(1 0 * * ? *)` if `enableSchemaRegistryEvent` is false or undefined, otherwise no schedule.
   */
  readonly runSchedule?: Schedule;

  /**
   * A flag to trigger the data source based on the Glue Schema Registry events.
   * The data source can be triggered by events independently of the schedule configured with `runSchedule`.
   * @default - false, meaning the EventBridge listener for schema changes is disabled.
   */
  readonly enableSchemaRegistryEvent?: boolean;

  /**
   * The KMS encryption key used to encrypt lambda environment, lambda logs and SSM parameters
   * @default - AWS managed customer master key (CMK) is used
   */
  readonly encryptionKey?: Key;

  /**
   * The removal policy to apply to the data source
   * @default - RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}
