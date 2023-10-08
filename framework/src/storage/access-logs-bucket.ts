// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketProps, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BucketUtils, Context } from '../utils';

/**
 * Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.
 * The bucket name and the bucket CDK ID must be less than 23 characters together.
 * The generated bucket name is <BUCKET_NAME>-<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>
 *
 * @example
 * import * as cdk from 'aws-cdk-lib';
 * import { AccessLogsBucket } from 'aws-data-solutions-framework';
 *
 * const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
 *  removalPolicy: RemovalPolicy.DESTROY,
 * })
 */
export class AccessLogsBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {

    const bucketName = BucketUtils.generateUniqueBucketName(id, scope, props?.bucketName);
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