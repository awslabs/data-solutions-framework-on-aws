export interface DataZoneFormTypeModelFieldProps {
  readonly name: string; // Field name
  readonly type: string; // Field type, e.g., 'String', 'Integer'
  readonly required?: boolean; // Whether the field is required
}