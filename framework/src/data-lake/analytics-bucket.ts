// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Names, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AnalyticsBucketProps } from './analytics-bucket-props';


/**
*  An Amazon S3 Bucket configured with best practices and defaults for Analytics:
*  * Server side buckets encryption managed by KMS customer key.
*  * SSL communication enforcement.
*  * Access logged to an S3 bucket within a prefix matching the bucket name.
*  * All public access blocked.
*  * Two-step protection for bucket and objects deletion.
*
* For custom requirements that are not covered, use {Bucket} directly.
*
* **Usage example**
*
* ```typescript
* import * as cdk from 'aws-cdk-lib';
* import { AnalyticsBucket} from 'aws-data-solutions-framework';
*
* const exampleApp = new cdk.App();
* const stack = new cdk.Stack(exampleApp, 'AnalyticsBucketStack');
*
* // Set context value for global data removal policy (or set in cdk.json).
* stack.node.setContext('adsf', {'remove_data_on_destroy': 'true'})
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
* ```
*/
export class AnalyticsBucket extends Bucket {

  private static LIFECYCLE_RULE = [{ abortIncompleteMultipartUploadAfter: Duration.days(1) }];
  private static FRAMEWORK_CONTEXT_VALUES = 'adsf';

  constructor(scope: Construct, id: string, props: AnalyticsBucketProps) {

    const bucketName = (props?.bucketName || 'analytics-bucket') + '-' + Names.uniqueResourceName(scope, {}).toLowerCase();
    
    const removeBucketObjects: boolean = scope.node.tryGetContext(AnalyticsBucket.FRAMEWORK_CONTEXT_VALUES)?.remove_data_on_destroy.toLowerCase() == 'true' || false;
    let autoDeleteObjects: boolean = (props?.removalPolicy == RemovalPolicy.DESTROY) && removeBucketObjects;

    super(scope, id, {
      ...props,
      bucketName: bucketName,
      autoDeleteObjects,
      serverAccessLogsPrefix: props?.serverAccessLogsPrefix || bucketName,
      enforceSSL: true,
      encryption: BucketEncryption.KMS,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props?.removalPolicy || RemovalPolicy.RETAIN,
      lifecycleRules: props?.lifecycleRules?.concat(AnalyticsBucket.LIFECYCLE_RULE) || AnalyticsBucket.LIFECYCLE_RULE,
    });
  }

}
