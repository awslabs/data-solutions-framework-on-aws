// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { KafkaClientLogLevel } from './msk-utils';
import { IKey } from 'aws-cdk-lib/aws-kms';

/**
 * Properties for the `MskServerlessCluster` construct
 */
export interface MskServerlessProps {

  /**
   * The name of the MSK Serverless cluster.
   * @default - default-msk-serverless
   */
  readonly clusterName?: string;

  /**
   * The VPC where to deploy the MSK Serverless cluster.
   * The VPC must have at least 2 subnets in two different AZs.
   * @default - A new Vpc is created
   */
  readonly vpc?: IVpc;

  /**
   * The subnets where to deploy the MSK Serverless cluster.
   * The subnets must be in distinct Availability Zones.
   * Client subnets can't be in Availability Zone us-east-1e.
   * @default - the Vpc default strategy if not specified.
   */
  readonly subnets?: SubnetSelection;

  /**
   * The AWS security groups to associate with the elastic network interfaces of the Amazon MSK cluster.
   * @default - create a new security group
   */
  readonly securityGroups?: ISecurityGroup[];

  /**
   * The log level for the lambda that support the Custom Resource
   * for both Managing ACLs and Topics.
   * @default WARN
   */
  readonly kafkaClientLogLevel?: KafkaClientLogLevel;

  /**
   * The AWS KMS key to use to encrypt  enviornment variable of lambda supporting the
   * MSK Custom Resources creation
   */
  readonly lambdaEnvironmentEncryptionKey?: IKey;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}
