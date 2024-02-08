// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { SecurityGroup, SubnetSelection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { RedshiftServerlessNamespace } from './redshift-serverless-namespace';

/**
 * RedshiftServerlessWorkgroup properties
 */
export interface RedshiftServerlessWorkgroupProps {
  /**
   * The name of the Redshift Serverless Workgroup
   */
  readonly name: string;

  /**
   * The base capacity of the Redshift Serverless Workgroup in RPU
   * @default - 128 RPU
   */
  readonly baseCapacity?: number;

  /**
   * The Redshift Serverless Namespace associated with the Workgroup
   */
  readonly namespace: RedshiftServerlessNamespace;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
  /**
   * The VPC where the Redshift Serverless Workgroup is deployed
   * @default - A default VPC is created
   */
  readonly vpc?: Vpc;

  /**
   * The subnets where the Redshift Serverless Workgroup is deployed
   * @default - Use the private subnets of the VPC
   */
  readonly subnets?: SubnetSelection;

  /**
   * The extra EC2 Security Groups to associate with the Redshift Serverless Workgroup (in addition to the primary Security Group).
   * @default - No extra security groups are used
   */
  readonly extraSecurityGroups?: SecurityGroup[];

  /**
   * The custom port to use when connecting to workgroup. Valid port ranges are 5431-5455 and 8191-8215.
   * @default - 5439
   */
  readonly port?: number;
}