// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
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
  readonly executionRole?: IRole;
  /**
   * The VPC to deploy the custom resource in.
   * @default - The Custom Resource is executed in VPCs owned by AWS Lambda service.
   */
  readonly vpc?: IVpc;
  /**
   * The subnets to deploy the custom resource in.
   * @default - The Custom Resource is executed in VPCs owned by AWS Lambda service.
   */
  readonly subnets?: SubnetSelection;
  /**
   * The list of security groups to attach to the custom resource.
   * @default - If `vpc` is not supplied, no security groups are attached. Otherwise, a dedicated security
   * group is created for each function.
   */
  readonly securityGroups?: ISecurityGroup [];
  /**
   * The policy to apply when the resource is removed from this stack.
   * @default - RETAIN. The resources will not be deleted.
   */
  readonly removalPolicy?: RemovalPolicy;
}
