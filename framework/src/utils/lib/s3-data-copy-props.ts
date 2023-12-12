// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { ISubnet, IVpc } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';

/**
 * Properties for S3DataCopy construct
 */
export interface S3DataCopyProps {

  /**
     * The source bucket
     */
  readonly sourceBucket: IBucket;
  /**
     * The source bucket prefix with a slash at the end
     * @default - No prefix is used
     */
  readonly sourceBucketPrefix?: string;
  /**
     * The source bucket region
     */
  readonly sourceBucketRegion: string;
  /**
     * the target bucket
     */
  readonly targetBucket: IBucket;
  /**
     * the target bucket prefix with a slash at the end
     * @default - No prefix is used
     */
  readonly targetBucketPrefix?: string;
  /**
     * The IAM role to use in the custom resource for copying data.
     * @default - A new role is created
     */
  readonly copyRole?: IRole;
  /**
     * The VPC to deploy the custom resource in.
     * @default - The Custom Resource is executed in AWS public environment
     */
  readonly vpc?: IVpc;
  /**
     * The subnets to deploy the custom resource in.
     * @default - The Custom Resource is executed in AWS public environment.
     */
  readonly subnets?: ISubnet[];
}
