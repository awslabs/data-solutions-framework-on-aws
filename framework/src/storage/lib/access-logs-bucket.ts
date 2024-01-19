// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketProps, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BucketUtils, Context } from '../../utils';

/**
 * Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.
 * Default bucket name is `accesslogs-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Storage/access-logs-bucket
 *
 * @example
 * const bucket = new dsf.storage.AccessLogsBucket(this, 'AccessLogsBucket', {
 *  removalPolicy: cdk.RemovalPolicy.DESTROY,
 * })
 *
 */
export class AccessLogsBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {

    const bucketName = props?.bucketName || BucketUtils.generateUniqueBucketName(scope, id, 'accesslogs');
    const removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    const autoDeleteObjects = removalPolicy == RemovalPolicy.DESTROY;

    super(scope, id, {
      ...props,
      bucketName: bucketName,
      encryption: props?.encryption || BucketEncryption.S3_MANAGED,
      enforceSSL: props?.enforceSSL || true,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects,
    });
  }
}