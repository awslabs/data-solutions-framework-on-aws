// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { KafkaClientLogLevel, ClientAuthentication } from './msk-utils';
import { IRole } from 'aws-cdk-lib/aws-iam';

/**
 * Properties for the `KafkaApi` construct
 */
export interface KafkaApiProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The IAM role to pass to mTLS lambda handler
   * This role must be able to be assumed with `lambda.amazonaws.com` service principal
   *
   */
  readonly mtlsHandlerRole?: IRole;

  /**
   * The IAM role to pass to IAM authentication lambda handler
   * This role must be able to be assumed with `lambda.amazonaws.com` service principal
   *
   */
  readonly iamHandlerRole?: IRole;

  /**
   * The ARN of the cluster
   */
  readonly clusterArn: string;

  /**
   * The AWS security groups to associate with the elastic network interfaces in order to specify who can
   * connect to and communicate with the Amazon MSK cluster.
   */
  readonly brokerSecurityGroup: ISecurityGroup;

  /**
   * Defines the virtual networking environment for this cluster.
   * Must have at least 2 subnets in two different AZs.
   */
  readonly vpc: IVpc;
  /**
   * The subnets where the Custom Resource Lambda Function would be created in.
   * @default - One private subnet with egress is used per AZ.
   */
  readonly subnets?: SubnetSelection;

  /**
   * This is the TLS certificate of the Principal that is used by
   * the CDK custom resource which set ACLs and Topics.
   * It must be provided if the cluster is using mTLS authentication.
   * The secret in AWS secrets manager must be a JSON in the following format
   * {
   *  "key" : "PRIVATE-KEY",
   *  "cert" : "CERTIFICATE"
   * }
   *
   * You can use the following utility to generate the certificates
   * https://github.com/aws-samples/amazon-msk-client-authentication
   */
  readonly certficateSecret?: ISecret;

  /**
   * Configuration properties for client authentication.
   * MSK supports using private TLS certificates or SASL/SCRAM to authenticate the identity of clients.
   */
  readonly clientAuthentication: ClientAuthentication;

  /**
   * The log level for the lambda that support the Custom Resource
   * for both Managing ACLs and Topics.
   * @default WARN
   */
  readonly kafkaClientLogLevel?: KafkaClientLogLevel;
}