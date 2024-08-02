import { RemovalPolicy } from 'aws-cdk-lib';
import { DataZoneFormTypeModelFieldProps } from './datazone-model-field-props';

export interface DataZoneFormTypeProps {
  readonly domainId: string;
  readonly projectId: string;
  readonly name: string;
  readonly fields: DataZoneFormTypeModelFieldProps[]; // Array of fields for the model
  readonly removalPolicy?: RemovalPolicy;

}