// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Utils } from './utils';

/**
 * Utils for working with Amazon S3 buckets.
 */
export class BucketUtils {

  /**
   * Generate a unique Amazon S3 bucket name based on the provided name, CDK construct ID and CDK construct scope.
   * The bucket name is suffixed the AWS account ID, the AWS region and a unique 8 characters hash.
   * The maximum length for name is 26 characters.
   * @param name the name of the bucket
   * @param id the CDK ID of the construct
   * @param scope the current scope where the construct is created (generally `this`)
   * @returns the unique Name for the bucket
   */
  public static generateUniqueBucketName(scope: Construct, id: string, name: string): string {
    if (name.length > 26) {
      throw new Error('Bucket name is too long, maximum length for bucketName is 26');
    }
    return name + '-' + Aws.ACCOUNT_ID + '-' + Aws.REGION + '-' + Utils.generateScopeIdHash(scope, id);
  }
}