// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Annotations, Duration, Names, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AnalyticsBucketProps } from './analytics-bucket-props';
import { ContextOptions } from '../utils';

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
*/
export class AnalyticsBucket extends Bucket {

  private static LIFECYCLE_RULE = [{ abortIncompleteMultipartUploadAfter: Duration.days(1) }];

  constructor(scope: Construct, id: string, props: AnalyticsBucketProps) {

    const bucketName = (props?.bucketName || 'analytics-bucket') + '-' + Names.uniqueResourceName(scope, {}).toLowerCase();

    const globalRemovalPolicy = scope.node.tryGetContext(ContextOptions.REMOVE_DATA_ON_DESTROY) || false ;
    const removalPolicy = props?.removalPolicy == RemovalPolicy.DESTROY && globalRemovalPolicy ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;
    const autoDeleteObjects = (removalPolicy == RemovalPolicy.DESTROY) && globalRemovalPolicy;

    if (props?.removalPolicy == RemovalPolicy.DESTROY && !globalRemovalPolicy) {
      Annotations.of(scope).addWarning(
        `WARNING: removalPolicy was reverted back to 'RemovalPolicy.RETAIN'.
        If you wish to set 'removalPolicy' to 'DESTROY' you must also
        set the global removal policy flag context variable in the 'cdk.json'
        or 'cdk.context.json': '@aws-data-solutions-framework/removeDataOnDestroy: true'`,
      );
    }

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
