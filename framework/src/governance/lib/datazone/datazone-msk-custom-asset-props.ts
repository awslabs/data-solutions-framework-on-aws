import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneMSKCustomAssetProps {
  topicName: string;
  clusterName: string;
  includeSchema: boolean;
  domainId: string;
  projectId: string;
  schemaVersion?: number;
  schemaArn?: string;
  registryArn?: string;
  readonly removalPolicy?: RemovalPolicy;

}
