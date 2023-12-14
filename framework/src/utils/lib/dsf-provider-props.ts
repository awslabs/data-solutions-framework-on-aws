// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';


/**
 * @internal
 * The properties for the DsfProvider construct
 */

export interface DsfProviderProps {

  /**
   * The policy to apply when the bucket is removed from this stack.
   * @default - RETAIN The resources will not be deleted.
   */
  readonly removalPolicy?: RemovalPolicy;
}