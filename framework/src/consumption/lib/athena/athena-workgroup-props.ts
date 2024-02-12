// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';

import { EngineVersion, State } from './athena-workgroup-config';

/**
 * Properties for the AthenaWorkgroup Construct
 */
export interface AthenaWorkgroupProps {
  /**
   * Name of the Workgroup.
   */
  readonly name: string;

  /**
   * The option to delete a workgroup and its contents even if the workgroup contains any named queries.
   * @default - Workgroup is retained.
   */
  readonly recursiveDeleteOption?: boolean;

  /**
   * The state of the Workgroup.
   * @default - ENABLED.
   */
  readonly state?: State;

  /**
   * The engine version on which the query runs.
   * @default - AUTO.
   */
  readonly engineVersion?: EngineVersion;

  /**
   *  Allows members assigned to a workgroup to reference Amazon S3 Requester Pays buckets in queries.
   * @default - False.
   */
  readonly requesterPaysEnabled?: boolean;

  /**
   *  If set to "true", the settings for the workgroup override client-side settings.
   * @default - True.
   */
  readonly enforceWorkGroupConfiguration?: boolean;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   *  Amazon S3 Bucket where query results are stored
   * @default - Create a new bucket with SSE encryption using AnalyticsBucket if not provided.
   */
  readonly resultBucket?: IBucket;

  /**
   *  Name for the S3 Bucket in case it should be created.
   * @default - Name will be provided.
   */
  readonly resultBucketName?: string;

  /**
   *  Specifies the location in Amazon S3 where query results are stored.
   */
  readonly resultLocationPrefix: string;

  /**
   *  Indicates that the Amazon CloudWatch metrics are enabled for the workgroup.
   * @default - True.
   */
  readonly publishCloudWatchMetricsEnabled?: boolean;

  /**
   * Role used to access user resources in an Athena for Apache Spark session.
   * @default - The role is created if PySpark engine version is selected and no role is provided.
   */
  readonly executionRole?: IRole;

  /**
   * Indicates the number of days after creation when objects are deleted from the Result bucket.
   */
  readonly resultsRetentionPeriod?: Duration;

  /**
   * Indicates the number of days after creation when objects are deleted from the Result bucket.
   */
  readonly bytesScannedCutoffPerQuery?: number;

  /**
   * Encryption key used to encrypt query results. Has to be provided if Result bucket is provided.
   * User needs to grant access to it for AthenaWorkGroup's executionRole (if Spark engine) or for
   * principals that were granted to run queries using AthenaWorkGroup's grantRunQueries.
   * @default - The key is created if Result Bucket is not provided.
   */
  readonly resultsEncryptionKey?: IKey;
}
