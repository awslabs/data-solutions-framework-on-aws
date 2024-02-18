// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DataVpcClientVpnEndpointProps } from './client-vpn-endpoint-props';

/**
 * The properties for the `DataVpc` construct
 */

export interface DataVpcProps {
  /**
   * The CIDR to use to create the subnets in the VPC.
   */
  readonly vpcCidr: string;
  /**
   * The KMS key used to encrypt the VPC Flow Logs in the CloudWatch Log Group.
   * The resource policy of the key must be configured according to the AWS documentation.
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html
   * @default - A new KMS key is created
   */
  readonly flowLogKey?: IKey;
  /**
   * The IAM Role used to send the VPC Flow Logs in CloudWatch.
   * The role must be configured as described in the AWS VPC Flow Log documentation.
   * @see https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-cwl.html#flow-logs-iam-role
   * @default - A new IAM role is created
   */
  readonly flowLogRole?: IRole;
  /**
   * The retention period to apply to VPC Flow Logs
   * @default - One week retention
   */
  readonly flowLogRetention?: RetentionDays;
  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
  /**
   * ClientVpnEndpoint propertioes. Required if client vpn endpoint is needed
   * @default None
   */
  readonly clientVpnEndpointProps?: DataVpcClientVpnEndpointProps;
}