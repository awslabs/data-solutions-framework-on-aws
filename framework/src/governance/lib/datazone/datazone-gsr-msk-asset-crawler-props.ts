import { Schedule } from 'aws-cdk-lib/aws-events';

export interface DatazoneGsrMskAssetCrawlerProps {
  clusterName: string;
  domainId: string;
  projectId: string;
  registryName: string;
  readonly eventBridgeSchedule?: Schedule; // For cron expressions
  readonly enableSchemaRegistryEvent?: boolean; // Toggle EventBridge listener for registry changes
}
