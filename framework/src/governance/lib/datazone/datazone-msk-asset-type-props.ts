// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';

/**
 * The properties for the DataZoneMskAssetType construct
 */
export interface DataZoneMskAssetTypeProps {
  /**
   * The DataZone domain identifier
   */
  readonly domainId: string;
  /**
   * The project identifier owner of the custom asset type
   * @default - A new project called MskGovernance is created
   */
  readonly projectId?: string;
  /**
   * The factory to create the custom asset type
   * @default - A new factory is created
   */
  readonly dzCustomAssetTypeFactory?: DataZoneCustomAssetTypeFactory;
  /**
   * The removal policy to apply to the asset type
   * @default - RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}