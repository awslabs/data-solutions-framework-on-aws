// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';

/**
 * The properties for the DataVpc construct
 */

export interface DataVpcProps {
  /**
     * The CIDR to use to create the subnets in the VPC.
     */
  readonly vpcCidr: string;
  /**
     * The KMS key for the VPC flow log group
     * @default - A new KMS key is created
     */
  readonly flowLogKey?: IKey;
  /**
     * The IAM role for the VPC flow log
     * @default - A new IAM role is created
     */
  readonly flowLogRole?: IRole;
  /**
     * Policy to apply when the bucket is removed from this stack.
     * * @default - RETAIN (The bucket will be orphaned).
     */
  readonly removalPolicy?: RemovalPolicy;
}