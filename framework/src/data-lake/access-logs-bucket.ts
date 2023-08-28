// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Names, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketProps, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * An Amazon S3 Bucket configured with best practices and smart defaults for storing S3 access logs.
 *
 * Smart defaults:
 *  * The default bucket name is `access-logs-<UNIQUE_ID>``
 *  * S3 Managed encryption
 *  * Public access is blocked
 *  * Ojects are retained after deletion of the CDK resource
 *  * SSL communication is enforced
 *
 * **Usage example**
 *
 * ```typescript
 * import * as cdk from 'aws-cdk-lib';
 * import { AccessLogsBucket } from 'aws-data-solutions-framework';
 *
 * const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
 *  encryption: BucketEncryption.KMS_MANAGED,
 *  removalPolicy: RemovalPolicy.DESTROY,
 *  autoDeleteObjects: true,
 * }
 */

export class AccessLogsBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {

    super(scope, id, {
      ...props,
      bucketName: (props?.bucketName || 'access-logs') + '-'+ Names.uniqueResourceName(scope, {}).toLowerCase(),
      encryption: props?.encryption || BucketEncryption.S3_MANAGED,
      enforceSSL: props?.enforceSSL || true,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props?.removalPolicy || RemovalPolicy.RETAIN,
      autoDeleteObjects: props?.autoDeleteObjects || false,
    });
  }

}