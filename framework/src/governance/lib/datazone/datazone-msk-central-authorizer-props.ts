// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';


/**
 * The properties for the DataZoneMskCentralAuthorizer construct
 */
export interface DataZoneMskCentralAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;
  /**
   * The removal policy to apply to the asset type
   * @default - RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}