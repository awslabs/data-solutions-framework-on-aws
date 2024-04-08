// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { KafkaClientLogLevel } from './msk-provisioned-props';
import { ClientAuthentication } from './msk-provisioned-props-utils';

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
   * This is the TLS certificate of the Principal that is used by
   * the CDK custom resource which set ACLs and Topics.
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
   *
   * @default - IAM is used
   */
  readonly clientAuthentication: ClientAuthentication;
  
  /**
   * The log level for the lambda that support the Custom Resource
   * for both Managing ACLs and Topics.
   * @default INFO
   */
  readonly kafkaClientLogLevel?: KafkaClientLogLevel;
}