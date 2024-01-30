// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

/**
 * The properties for the `RedshiftData` construct
 */
export interface RedshiftDataProps {

  /**
   * The name of the Redshift provisioned to query. It must be configured if the `workgroupId` is not.
   * @default - The `workgroupId` is used
   */
  readonly clusterId?: string;

  /**
   * The `workgroupId` for the Redshift Serverless Workgroup to query. It must be configured if the `clusterId` is not.
   * @default - The `clusterId` is used
   */
  readonly workgroupId?: string;

  /**
   * The Secrets Manager Secret containing the admin credentials for the Redshift cluster / namespace.
   */
  readonly secret: ISecret;

  /**
   * The KMS Key used by the Secret
   */
  readonly secretKmsKey: IKey;

  /**
   * The VPC where the Custom Resource Lambda Function would be created in.
   * A Redshift Data API Interface VPC Endpoint is created in the VPC.
   * @default - No VPC is used. The Custom Resource runs in the Redshift service team VPC
   */
  readonly vpc?: IVpc;

  /**
   * The subnets where the Custom Resource Lambda Function would be created in.
   * A Redshift Data API Interface VPC Endpoint is created in the subnets.
   */
  readonly subnets?: SelectedSubnets;


  /**
   * If set to true, create the Redshift Data Interface VPC Endpoint in the configured VPC/Subnets.
   * @default - false
   */
  readonly createInterfaceVpcEndpoint?: boolean;

  /**
   * The timeout for the query execution.
   * @default - 5mins
   */
  readonly executionTimeout?: Duration;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}