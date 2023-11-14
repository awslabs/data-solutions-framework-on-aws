// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Annotations, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * @internal
 * Utils class to work with the CDK context and options
 */
export class Context {
  /**
   * Method to revert a DESTROY removal policy to RETAIN if the global removal policy parameter
   * in the CDK context is not set to true.
   * Also create a warning to warn the user if the retention policy has been reverted to RETAIN.
   * @param retentionPolicy The retention policy provided to the construct
   * @return the new retention policy based on the global retention parameter set in the CDK context
   */
  public static revertRemovalPolicy(scope: Construct, removalPolicy?: RemovalPolicy): RemovalPolicy {
    const globalRemovalPolicy = scope.node.tryGetContext(ContextOptions.REMOVE_DATA_ON_DESTROY) || false;

    if (removalPolicy == RemovalPolicy.DESTROY && !globalRemovalPolicy) {
      Annotations.of(scope).addWarning(
        `WARNING: removalPolicy was reverted back to 'RemovalPolicy.RETAIN'.
        If you wish to set 'removalPolicy' to 'DESTROY' you must also
        set the global removal policy flag context variable in the 'cdk.json'
        or 'cdk.context.json': '@data-solutions-framework-on-aws/removeDataOnDestroy: true'`,
      );
    }
    return removalPolicy == RemovalPolicy.DESTROY && globalRemovalPolicy ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;
  }
}

/**
 * @internal
 * Options used in the CDK context
 */
export enum ContextOptions {
  DISABLE_CONSTRUCTS_DEPLOYMENT_TRACKING = '@data-solutions-framework-on-aws/disableConstructsDeploymentTracking',
  REMOVE_DATA_ON_DESTROY = '@data-solutions-framework-on-aws/removeDataOnDestroy',
}
