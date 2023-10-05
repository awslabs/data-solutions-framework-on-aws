// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_iam, aws_kms, aws_s3, RemovalPolicy } from 'aws-cdk-lib';

/**
 * Properties of the {@link AnalyticsBucket} construct
 */
export interface AnalyticsBucketProps {
  /**
   * Whether this bucket should have versioning turned on or not.
   * @default false (unless object lock is enabled, then true)
   */
  readonly versioned?: boolean;

  /**
   * Whether this bucket should have transfer acceleration turned on or not.
   * @default false
   */
  readonly transferAcceleration?: boolean;

  /**
   * Optional log file prefix to use for the bucket's access logs.
   * If defined without "serverAccessLogsBucket", enables access logs to current bucket with this prefix.
   * @default - No log file prefix
   */
  readonly serverAccessLogsPrefix?: string;

  /**
   * Destination bucket for the server access logs.
   * @default - If "serverAccessLogsPrefix" undefined - access logs disabled, otherwise - log to current bucket.
   */
  readonly serverAccessLogsBucket?: aws_s3.IBucket;

  /**
   * Policy to apply when the bucket is removed from this stack.
   * * @default - RETAIN (The bucket will be orphaned).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * Grants public read access to all objects in the bucket.
   * Similar to calling `bucket.grantPublicAccess()`
   * @default false
   */
  readonly publicReadAccess?: boolean;

  /**
   * The objectOwnership of the bucket.
   * @default - No ObjectOwnership configuration, uploading account will own the object.
   */
  readonly objectOwnership?: aws_s3.ObjectOwnership;

  /**
   * Enable object lock on the bucket.
   * Enabling object lock for existing buckets is not supported. Object lock must be
   * enabled when the bucket is created.
   * @default false, unless objectLockDefaultRetention is set (then, true)
   */
  readonly objectLockEnabled?: boolean;

  /**
   * The default retention mode and rules for S3 Object Lock.
   * Default retention can be configured after a bucket is created if the bucket already
   * has object lock enabled. Enabling object lock for existing buckets is not supported.
   * @default no default retention period
   */
  readonly objectLockDefaultRetention?: aws_s3.ObjectLockRetention;

  /**
   * The role to be used by the notifications handler.
   * @default - a new role will be created.
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
   * The inventory configuration of the bucket.
   * @default - No inventory configuration
   */
  readonly inventories?: Array<aws_s3.Inventory>;

  /**
   * Inteligent Tiering Configurations.
   * @default No Intelligent Tiiering Configurations.
   */
  readonly intelligentTieringConfigurations?: Array<aws_s3.IntelligentTieringConfiguration>;

  /**
   * Whether this bucket should send notifications to Amazon EventBridge or not.
   * @default false
   */
  readonly eventBridgeEnabled?: boolean;

  /**
   * Enforces SSL for requests.
   * S3.5 of the AWS Foundational Security Best Practices Regarding S3.
   * @default false
   */
  readonly enforceSSL?: boolean;

  /**
   * External KMS key to use for bucket encryption.
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
   * Physical name of this bucket.
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
   * @default - false
   */
  readonly bucketKeyEnabled?: boolean;

  /**
   * The block public access configuration of this bucket.
   * @default - CloudFormation defaults will apply. New buckets and objects don't allow public access,
   * but users can modify bucket policies or object permissions to allow public access
   */
  readonly blockPublicAccess?: aws_s3.BlockPublicAccess;

  /**
   * Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted.
   * Requires the `removalPolicy` to be set to `RemovalPolicy.DESTROY`.
   *
   * **Warning** if you have deployed a bucket with `autoDeleteObjects: true`,
   * switching this to `false` in a CDK version *before* `1.126.0` will lead to
   * all objects in the bucket being deleted. Be sure to update your bucket resources
   * by deploying with CDK version `1.126.0` or later **before** switching this value to `false`.
   * @default false
   */
  readonly autoDeleteObjects?: boolean;

  /**
   * Specifies a canned ACL that grants predefined permissions to the bucket.
   * @default BucketAccessControl.PRIVATE
   */
  readonly accessControl?: aws_s3.BucketAccessControl;
}
