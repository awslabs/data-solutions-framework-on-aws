// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


export interface DataZoneMskEnvironmentAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;
  /**
   * The central account Id
   */
  readonly centralAccountId?: string;
  /**
   * If the authorizer is granting MSK managed VPC permissions
   * @default - false
   */
  readonly grantMskManagedVpc?: boolean;
  /**
   * The IAM Role used to grant MSK topics
   * @default - A new role will be created
   */
  readonly grantRole?: Role;
  /**
   * The IAM Role used by the Step Function state machine
   * @default - A new role will be created
   */
  readonly stateMachineRole?: Role;
  /**
   * Cloudwatch Logs retention.
   * @default - 7 days
   */
  readonly logRetention?: RetentionDays;
  /**
   * The removal policy to apply to the asset type
   * @default - RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}