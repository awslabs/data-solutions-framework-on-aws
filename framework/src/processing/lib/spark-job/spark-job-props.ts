// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';

/**
 * The properties for the `SparkJob` construct.
 */
export interface SparkJobProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The Schedule to run the Step Functions state machine.
   * @default - The Step Functions State Machine is not scheduled.
   */
  readonly schedule?: Schedule;
}