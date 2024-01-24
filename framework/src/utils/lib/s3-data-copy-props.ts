// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';

/**
 * Properties for S3DataCopy construct
 */
export interface S3DataCopyProps {

  /**
   * The source S3 Bucket containing the data to copy
   */
  readonly sourceBucket: IBucket;
  /**
   * The source bucket prefix with a slash at the end
   * @default - No prefix is used
   */
  readonly sourceBucketPrefix?: string;
  /**
   * The source S3 Bucket region
   */
  readonly sourceBucketRegion: string;
  /**
   * The target S3 Bucket
   */
  readonly targetBucket: IBucket;
  /**
   * The target S3 Bucket prefix with a slash at the end
   * @default - No prefix is used
   */
  readonly targetBucketPrefix?: string;
  /**
   * The IAM Role to use in the custom resource for copying data.
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
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}
