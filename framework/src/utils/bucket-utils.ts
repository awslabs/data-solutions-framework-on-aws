// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { createHmac } from 'crypto';
import { Aws } from 'aws-cdk-lib';
import { Construct } from 'constructs';

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
    return name + '-' + Aws.ACCOUNT_ID + '-' + Aws.REGION + '-' + BucketUtils.generateHash(scope, id);
  }

  /**
   * Generate an 8 characters hash of the CDK scope using its path.
   * @param scope the CDK construct scope
   * @returns the hash
   */
  private static generateHash(scope: Construct, id: string): string {
    const node = scope.node;

    const components = node.scopes.slice(1).map(c => c.node.id).join('-').concat(id);

    const secret = 'AWS Data Solutions Framework';
    const hash = createHmac('sha256', secret)
      .update(components)
      .digest('hex')
      .slice(0, 8);

    return hash;
  }
}