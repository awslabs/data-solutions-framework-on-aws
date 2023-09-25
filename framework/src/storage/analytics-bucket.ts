// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Duration, Names, RemovalPolicy, UniqueResourceNameOptions } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AnalyticsBucketProps } from './analytics-bucket-props';
import { Context } from '../utils';

/**
* Amazon S3 Bucket configured with best-practices and defaults for analytics.
* See documentation TODO insert link
*
* @example
* import * as cdk from 'aws-cdk-lib';
* import { AnalyticsBucket} from 'aws-data-solutions-framework';
*
* const exampleApp = new cdk.App();
* const stack = new cdk.Stack(exampleApp, 'AnalyticsBucketStack');
*
* // Set context value for global data removal policy (or set in cdk.json).
* stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);
*
* const encryptionKey = new Key(stack, 'DataKey', {
*  removalPolicy: RemovalPolicy.DESTROY,
*  enableKeyRotation: true,
* });
*
* new AnalyticsBucket(stack, 'MyAnalyticsBucket', {
*  encryptionKey,
*  removalPolicy: cdk.RemovalPolicy.DESTROY,
* });
*/
export class AnalyticsBucket extends Bucket {

  private static LIFECYCLE_RULE = [{ abortIncompleteMultipartUploadAfter: Duration.days(1) }];

  constructor(scope: Construct, id: string, props: AnalyticsBucketProps) {

    const bucketName = props?.bucketName || 'analytics-bucket';
    const removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    const autoDeleteObjects = removalPolicy == RemovalPolicy.DESTROY;

    const uniqueResourceNameOptions: UniqueResourceNameOptions = {
      maxLength: 60 - bucketName.length,
    };

    super(scope, id, {
      ...props,
      autoDeleteObjects,
      bucketName: bucketName + '-' + Names.uniqueResourceName(scope, uniqueResourceNameOptions).toLowerCase(),
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: BucketEncryption.KMS,
      lifecycleRules: props?.lifecycleRules?.concat(AnalyticsBucket.LIFECYCLE_RULE) || AnalyticsBucket.LIFECYCLE_RULE,
      removalPolicy,
      serverAccessLogsPrefix: props?.serverAccessLogsPrefix || bucketName,
    });
  }

}
