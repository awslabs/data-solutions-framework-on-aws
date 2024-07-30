import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneMskEnvironmentAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;

  readonly removalPolicy?: RemovalPolicy;
}