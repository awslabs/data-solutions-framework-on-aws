// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Interface representing a DataZoneFormTypeField
 */
export interface DataZoneFormTypeField {
  /**
   * The name of the field
   */
  readonly name: string;
  /**
   * The type of the field
   */
  readonly type: string;
  /**
   * Whether the field is required
   * @default false
   */
  readonly required?: boolean;
}

/**
 * Interface representing a DataZoneFormType
 */
export interface DataZoneFormType {
  /**
   * The name of the form
   */
  readonly name: string;
  /**
   * The fields of the form
   * @example [{ name: 'firstName', type: 'String', required: true }]
   * @default - No model is required. The form is already configured in DataZone.
   */
  readonly model?: DataZoneFormTypeField[];
  /**
   * Whether the form is required
   * @default false
   */
  readonly required?: boolean; // Whether the form is required
}

/**
 * Properties for the DataZoneCustomAssetType construct
 */
export interface DataZoneCustomAssetTypeProps {
  /**
   * The project identifier owner of the custom asset type
   */
  readonly projectId: string;
  /**
   * The form types of the custom asset type
   * @example [{ name: 'userForm', model: [{ name: 'firstName', type: 'String', required: true }] }]
   */
  readonly formTypes: DataZoneFormType[];
  /**
   * The name of the custom asset type
   */
  readonly assetTypeName: string;
  /**
   * The description of the custom asset type
   * @default - No description provided
   */
  readonly assetTypeDescription?: string;
}