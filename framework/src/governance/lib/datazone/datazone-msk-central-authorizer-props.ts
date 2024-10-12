// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


/**
 * The properties for the DataZoneMskCentralAuthorizer construct
 */
export interface DataZoneMskCentralAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;
  /**
   * The IAM Role used to collect metadata on DataZone assets
   * @default - A new role will be created
   */
  readonly metadataCollectorRole?: Role;
  /**
   * The IAM Role used to callback DataZone and acknowledge the subscription grant
   * @default - A new role will be created
   */
  readonly callbackRole?: Role;
  /**
   * The IAM Role used by the Event Bridge event to trigger the authorizer
   * @default - A new role will be created
   */
  readonly datazoneEventRole?: Role;
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