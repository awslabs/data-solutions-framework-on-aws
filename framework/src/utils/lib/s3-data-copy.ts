// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { IBucket } from "aws-cdk-lib/aws-s3";

/**
 * Properties for S3DataCopy construct
 */
export interface S3DataCopyProps {
  
  /**
   * The source bucket
   */
  readonly sourceBucket: IBucket;
  /**
   * The source bucket prefix
   */
  readonly sourceBucketPrefix: string;
  /**
   * The source bucket region
   */
  readonly sourceBucketRegion: string;
  /**
   * the target bucket
   */
  readonly targetBucket: IBucket;
  /**
   * the target bucket prefix
   */
  readonly targetBucketPrefix: string;
}

/**
 * Copy data from one S3 bucket to another.
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy
 */