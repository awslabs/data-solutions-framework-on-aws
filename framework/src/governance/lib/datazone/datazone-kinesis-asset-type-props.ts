// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';

/**
 * Properties for configuring a DataZone Kinesis asset type.
 */
export interface DataZoneKinesisAssetTypeProps {
  /**
   * The unique identifier for the DataZone domain where the asset type resides.
   */
  readonly domainId: string;

  /**
   * The unique identifier for the project associated with this asset type.
   * @default - A new project called KinesisGovernance is created
   */
  readonly projectId?: string;

  /**
   * Optional. The factory used to create the custom asset type.
   * @default - A new factory is created if not specified.
   */
  readonly dzCustomAssetTypeFactory?: DataZoneCustomAssetTypeFactory;

  /**
   * Optional. The removal policy to apply to the asset type.
   * @default - RemovalPolicy.RETAIN, meaning the asset type is retained even if the stack is deleted.
   */
  readonly removalPolicy?: RemovalPolicy;
}
