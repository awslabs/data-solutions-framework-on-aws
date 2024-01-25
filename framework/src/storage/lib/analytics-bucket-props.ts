// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { aws_iam, aws_kms, aws_s3, RemovalPolicy } from 'aws-cdk-lib';

/**
 * Properties for the `AnalyticsBucket` construct
 */
export interface AnalyticsBucketProps {
  /**
   * Whether this S3 Bucket should have versioning turned on or not.
   * @default - False (unless object lock is enabled, then true)
   */
  readonly versioned?: boolean;

  /**
   * Whether this S3 Bucket should have transfer acceleration turned on or not.
   * @default - False
   */
  readonly transferAcceleration?: boolean;

  /**
   * Optional log file prefix to use for the S3 Bucket's access logs.
   * If defined without "serverAccessLogsBucket", enables access logs to current S3 Bucket with this prefix.
   * @default - No log file prefix
   */
  readonly serverAccessLogsPrefix?: string;

  /**
   * S3 Bucket destination for the server access logs.
   * @default - If "serverAccessLogsPrefix" undefined - access logs disabled, otherwise - log to current bucket.
   */
  readonly serverAccessLogsBucket?: aws_s3.IBucket;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * Grants public read access to all objects in the S3 Bucket.
   * Similar to calling `bucket.grantPublicAccess()`
   * @default - False
   */
  readonly publicReadAccess?: boolean;

  /**
   * The objectOwnership of the S3 Bucket.
   * @default - No ObjectOwnership configuration, uploading account will own the object.
   */
  readonly objectOwnership?: aws_s3.ObjectOwnership;

  /**
   * Enable object lock on the S3 Bucket.
   * Enabling object lock for existing buckets is not supported. Object lock must be enabled when the bucket is created.
   * @default - False, unless objectLockDefaultRetention is set (then, true)
   */
  readonly objectLockEnabled?: boolean;

  /**
   * The default retention mode and rules for S3 Object Lock.
   * Default retention can be configured after a bucket is created if the bucket already
   * has object lock enabled. Enabling object lock for existing buckets is not supported.
   * @default - No default retention period
   */
  readonly objectLockDefaultRetention?: aws_s3.ObjectLockRetention;

  /**
   * The IAM Role to be used by the notifications handler.
   * @default - A new IAM Role will be created.
   */
  readonly notificationsHandlerRole?: aws_iam.IRole;

  /**
   * The metrics configuration of this bucket.
   * @default - No metrics configuration.
   */
  readonly metrics?: Array<aws_s3.BucketMetrics>;

  /**
   * Rules that define how Amazon S3 manages objects during their lifetime.
   * @default - No lifecycle rules.
   */
  readonly lifecycleRules?: Array<aws_s3.LifecycleRule>;

  /**
   * The inventory configuration of the S3 Bucket.
   * @default - No inventory configuration
   */
  readonly inventories?: Array<aws_s3.Inventory>;

  /**
   * Intelligent Tiering Configurations.
   * @default - No Intelligent Tiiering Configurations.
   */
  readonly intelligentTieringConfigurations?: Array<aws_s3.IntelligentTieringConfiguration>;

  /**
   * Whether this S3 Bucket should send notifications to Amazon EventBridge or not.
   * @default - False
   */
  readonly eventBridgeEnabled?: boolean;

  /**
   * Enforces SSL for requests.
   * S3.5 of the AWS Foundational Security Best Practices Regarding S3.
   * @default - False
   */
  readonly enforceSSL?: boolean;

  /**
   * External KMS Key to use for the S3 Bucket encryption.
   * The `encryption` property must be either not specified or set to `KMS` or `DSSE`.
   * An error will be emitted if `encryption` is set to `UNENCRYPTED` or `S3_MANAGED`.
   * @default - If `encryption` is set to `KMS` and this property is undefined,
   * a new KMS key will be created and associated with this bucket.
   */
  readonly encryptionKey: aws_kms.IKey;

  /**
   * The CORS configuration of this bucket.
   * @default - No CORS configuration.
   */
  readonly cors?: Array<aws_s3.CorsRule>;

  /**
   * The physical name of this S3 Bucket.
   * @default - `analytics-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`
   */
  readonly bucketName?: string;

  /**
   * Whether Amazon S3 should use its own intermediary key to generate data keys.
   * Only relevant when using KMS for encryption.
   *
   * - If not enabled, every object GET and PUT will cause an API call to KMS (with the
   *   attendant cost implications of that).
   * - If enabled, S3 will use its own time-limited key instead.
   *
   * Only relevant, when Encryption is set to `BucketEncryption.KMS` or `BucketEncryption.KMS_MANAGED`.
   * @default - False
   */
  readonly bucketKeyEnabled?: boolean;

  /**
   * The block public access configuration of this bucket.
   * @default - CloudFormation defaults will apply. New buckets and objects don't allow public access,
   * but users can modify bucket policies or object permissions to allow public access
   */
  readonly blockPublicAccess?: aws_s3.BlockPublicAccess;

  /**
   * Whether all objects should be automatically deleted when the S3 Bucket is removed from the stack or when the stack is deleted.
   * Requires the `removalPolicy` to be set to `RemovalPolicy.DESTROY`.
   * @default - False
   */
  readonly autoDeleteObjects?: boolean;

  /**
   * Specifies a canned ACL that grants predefined permissions to the bucket.
   * @default - BucketAccessControl.PRIVATE
   */
  readonly accessControl?: aws_s3.BucketAccessControl;
}
