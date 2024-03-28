// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { ClientAuthentication } from './msk-provisioned-props-utils';
import { KafkaClientLogLevel } from './msk-provisioned-props';

/**
 * Properties for the `MskServerlessCluster` construct
 */
export interface KafkaApiProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  readonly clusterName: string;

  readonly clusterArn: string;

  readonly brokerSecurityGroup: ISecurityGroup;

  readonly vpc: IVpc;

  readonly certficateSecret?: ISecret;

  readonly clientAuthentication: ClientAuthentication;

  readonly kafkaClientLogLevel?: KafkaClientLogLevel;
}