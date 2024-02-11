// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from "aws-cdk-lib";
import { CfnServerlessCluster } from "aws-cdk-lib/aws-msk";

/**
 * Properties for the `SparkEmrServerlessRuntime` construct
 */
export interface MskServerlessProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  readonly clusterName: string;

  readonly clientAuthentication: CfnServerlessCluster.ClientAuthenticationProperty;

  readonly vpcConfigs: CfnServerlessCluster.VpcConfigProperty;

}