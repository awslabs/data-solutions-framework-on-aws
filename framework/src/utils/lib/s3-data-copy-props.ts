// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { ISubnet, SubnetSelection } from "aws-cdk-lib/aws-ec2";
import { IRole } from "aws-cdk-lib/aws-iam";
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
    /**
     * The IAM role to use in the custom resource for copying data.
     */
    readonly iamRole: IRole;
    /**
     * The subnets to deploy the custom resource in.
     * @default - A VPC is created with 1 private subnet and 1 VPC endpoint for S3
     */
    readonly subnets?: ISubnet[];
  }
  