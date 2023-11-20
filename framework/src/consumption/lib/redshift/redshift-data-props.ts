// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

/**
 * RedshiftData properties
 */
export interface RedshiftDataProps {

  /**
   * The provisioned Redshift cluster name. It's either this or the `workgroupId`.
   */
  readonly clusterIdentifier?: string;

  /**
   * The `workgroupId` for the Redshift Serverless Workgroup. It's either this or the `clusterIdentifier`.
   */
  readonly workgroupId?: string;

  /**
   * The Secrets Manager secret containing the admin credentials for the Redshift cluster / namespace.
   */
  readonly secret: ISecret;

  /**
   * The KMS Key used by the secret
   */
  readonly secretKmsKey: IKey;

  /**
   * The VPC where the Custom Resource Lambda function would be created in. A Redshift Data API Interface VPC Endpoint would be created in the VPC.
   */
  readonly vpc?: IVpc;

  /**
   * The subnets where the Custom Resource Lambda function would be created in. A Redshift Data API Interface VPC Endpoint would be created in the subnets.
   */
  readonly selectedSubnets?: SelectedSubnets;


  /**
   * If set to true, this construct would also create the Redshift Data Interface VPC Endpoint in the VPC/Subnets that's configured.
   * @default false
   */
  readonly createInterfaceVpcEndpoint?: boolean;

  /**
   * Timeout for query execution.
   * @default 5mins
   */
  readonly executionTimeout?: Duration;

  /**
   * The removal policy when the stack is deleted
   */
  readonly removalPolicy?: RemovalPolicy;
}