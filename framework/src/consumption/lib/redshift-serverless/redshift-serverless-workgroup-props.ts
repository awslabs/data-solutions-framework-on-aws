// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { SecurityGroup, SubnetSelection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { RedshiftServerlessNamespace } from './redshift-serverless-namespace';

/**
 * RedshiftServerlessWorkgroup properties
 */
export interface RedshiftServerlessWorkgroupProps {
  /**
   * Name of the workgroup
   */
  readonly workgroupName: string;

  /**
   * Base capacity
   * @default 128
   */
  readonly baseCapacity?: number;

  /**
   * The associated namespace
   * @default A namespace is created when none is provided
   */
  readonly namespace?: RedshiftServerlessNamespace;

  /**
   * The removal policy associated with the workgroup
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`)
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The VPC the workgroup would be associated with
   * @default A VPC would automatically be created
   */
  readonly vpc?: Vpc;

  /**
   * The subnets the workgroup would be associated with
   * @default selects the private subnets
   */
  readonly subnets?: SubnetSelection;

  /**
   * The security groups the workgroup would be associated with in addition to the primary security group
   */
  readonly securityGroups?: SecurityGroup[];

  /**
   * Custom port to use when connecting to workgroup. Valid port ranges are 5431-5455 and 8191-8215.
   * @default 5439
   */
  readonly port?: number;

  /**
   * The default IAM role that is associated with the default namespace that's automatically created when no namespace is provided
   * @default No default IAM Role would be associated with the default namespace
   */
  readonly defaultNamespaceDefaultIAMRole?: IRole;

  /**
   * The IAM roles that is associated with the default namespace that's automatically created when no namespace is provided
   * @default No IAM roles would be associated with the default namespace
   */
  readonly defaultNamespaceIAMRoles?: IRole[];
}