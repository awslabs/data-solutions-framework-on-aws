// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';

/**
 * The properties for the `EmrVirtualCluster` Construct class.
 */
export interface EmrVirtualClusterProps {
  /**
   * The name of the Amazon EMR Virtual Cluster to be created
   */
  readonly name: string;
  /**
   * The name of the EKS namespace to be linked to the EMR virtual cluster
   * @default - Use the default namespace
   */
  readonly eksNamespace?: string;

  /**
   * The flag to create EKS namespace
   * @default - Do not create the namespace
   */
  readonly createNamespace?: boolean;

  /**
   * The tags assigned to the Virtual Cluster
   *
   * @default - none
   */
  readonly tags?: { [key: string]: string };

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}