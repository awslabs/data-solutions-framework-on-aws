
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