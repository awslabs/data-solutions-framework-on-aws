// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, Names } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * @internal
 */
export class BucketUtils {
  /**
   * Return a unique id for the given scope.
   * Calculated based on the hash of the scope path and the last maxLength characters.
   * @param scope
   * @param maxLength
   * @returns the unique ID for the given scope.
   */
  public static generateId(scope: Construct, maxLength: number): string {
    const cdkUniqueName = Names.uniqueResourceName(scope, {
      maxLength: maxLength,
    }).toLowerCase();
    const cdkUniqueNameLength = cdkUniqueName.length;
    const offset = cdkUniqueNameLength > maxLength ? maxLength : cdkUniqueNameLength ;
    return cdkUniqueName.substring(cdkUniqueNameLength - offset, cdkUniqueNameLength);
  }

  /**
   * Generate a unique Amazon S3 bucket name based on the provided name.
   * The bucket name is suffixed with the CDK ID, the AWS account ID, the AWS region and a hash.
   * @param name the name of the bucket
   * @param id the CDK
   * @param scope the scope of the bucket
   * @returns the unique Name for the bucket
   */
  public static generateUniqueBucketName(id: string, scope: Construct, name?: string): string {
    const bucketNameSuffix = id.toLowerCase() + '-' + Aws.ACCOUNT_ID + '-' + Aws.REGION + '-' + BucketUtils.generateId(scope, 16);
    const bucketName = name ? name + '-' : '' ;

    return bucketName + bucketNameSuffix;
  }
}