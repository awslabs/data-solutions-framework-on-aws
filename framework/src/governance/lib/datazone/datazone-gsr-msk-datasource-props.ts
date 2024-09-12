// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Schedule } from 'aws-cdk-lib/aws-events';

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
   * Optional. Defines the schedule for EventBridge events, specified using cron expressions.
   * @default - `cron(1 0 * * ? *)` if `enableSchemaRegistryEvent` is false or undefined, otherwise no schedule.
   */
  readonly runSchedule?: Schedule;

  /**
   * Optional. A flag to enable or disable EventBridge listener for schema registry changes.
   * @default - false, meaning the EventBridge listener for schema changes is disabled.
   */
  readonly enableSchemaRegistryEvent?: boolean;
}
