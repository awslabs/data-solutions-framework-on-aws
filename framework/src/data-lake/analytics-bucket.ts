// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Annotations, Duration, Names, RemovalPolicy } from 'aws-cdk-lib';
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
    
    const globalRemovalPolicy: boolean = scope.node.tryGetContext(AnalyticsBucket.FRAMEWORK_CONTEXT_VALUES)?.remove_data_on_destroy.toLowerCase() == 'true' || false;
    const removalPolicy: RemovalPolicy = props?.removalPolicy == RemovalPolicy.DESTROY && globalRemovalPolicy ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;
    const autoDeleteObjects: boolean = (removalPolicy == RemovalPolicy.DESTROY) && globalRemovalPolicy;

    if (props?.removalPolicy == RemovalPolicy.DESTROY && !globalRemovalPolicy)
      Annotations.of(scope).addWarning(
        `WARNING: removalPolicy was reverted back to 'RemovalPolicy.RETAIN'.
        If you wish to set 'removalPolicy' to 'DESTROY' you must also
        set the global removal policy flag context variable in the 'cdk.json'
        or 'cdk.context.json': "adsf": { "remove_data_on_destroy": "true" }.`
      );

    super(scope, id, {
      ...props,
      autoDeleteObjects,
      bucketName,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: BucketEncryption.KMS,
      lifecycleRules: props?.lifecycleRules?.concat(AnalyticsBucket.LIFECYCLE_RULE) || AnalyticsBucket.LIFECYCLE_RULE,
      removalPolicy,
      serverAccessLogsPrefix: props?.serverAccessLogsPrefix || bucketName,
    });
  }

}
