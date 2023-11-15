// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AnalyticsBucketProps } from './analytics-bucket-props';
import { Context, BucketUtils } from '../../utils';

/**
* Amazon S3 Bucket configured with best-practices and defaults for analytics.
* The default bucket name is `analytics-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`
* @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/analytics-bucket
*
* @example
* import { Key } from 'aws-cdk-lib/aws-kms';
*
* // Set context value for global data removal policy (or set in cdk.json).
* this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
*
* const encryptionKey = new Key(this, 'DataKey', {
*  removalPolicy: cdk.RemovalPolicy.DESTROY,
*  enableKeyRotation: true,
* });
*
* new dsf.storage.AnalyticsBucket(this, 'MyAnalyticsBucket', {
*  encryptionKey,
*  removalPolicy: cdk.RemovalPolicy.DESTROY,
* });
*/
export class AnalyticsBucket extends Bucket {

  private static LIFECYCLE_RULE = [{ abortIncompleteMultipartUploadAfter: Duration.days(1) }];

  constructor(scope: Construct, id: string, props: AnalyticsBucketProps) {

    const bucketName = props.bucketName || BucketUtils.generateUniqueBucketName(scope, id, 'analytics');
    const removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    const autoDeleteObjects = removalPolicy == RemovalPolicy.DESTROY;

    super(scope, id, {
      ...props,
      autoDeleteObjects,
      bucketName: bucketName,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: BucketEncryption.KMS,
      lifecycleRules: props?.lifecycleRules?.concat(AnalyticsBucket.LIFECYCLE_RULE) || AnalyticsBucket.LIFECYCLE_RULE,
      removalPolicy,
      serverAccessLogsPrefix: props?.serverAccessLogsPrefix || bucketName,
    });
  }

}
