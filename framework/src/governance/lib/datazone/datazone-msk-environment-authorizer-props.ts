// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneMskEnvironmentAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;
  /**
   * The central account Id
   */
  readonly centralAccountId?: string;

  readonly removalPolicy?: RemovalPolicy;
}