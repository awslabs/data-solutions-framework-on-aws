import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneMSKCustomAssetProps {
  topicName: string;
  clusterName: string;
  includeSchema: boolean;
  domainId: string;
  projectId: string;
  schemaVersion?: number;
  schemaArn?: string;
  sourceIdentifier?: string;
  schemaDefinition?: string;
  latestVersion?: boolean;
  readonly registryName?: string;
  readonly schemaName?: string | undefined;
  readonly removalPolicy?: RemovalPolicy;

}
