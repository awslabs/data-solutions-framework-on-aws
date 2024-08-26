// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface DataZoneFormTypeField {
  readonly name: string; // Field name
  readonly type: string; // Field type, e.g., 'String', 'Integer'
  readonly required?: boolean; // Whether the field is required
}

export interface DataZoneFormType {
  readonly name: string; // Form name
  readonly model?: DataZoneFormTypeField[];
  readonly required?: boolean; // Whether the form is required
}

export interface DataZoneCustomAssetTypeProps {
  readonly domainId: string;
  readonly projectId: string;
  readonly formTypes: DataZoneFormType[];
  readonly assetTypeName: string;
  readonly assetTypeDescription?: string;
}