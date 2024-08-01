import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneMskCentralAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;

  readonly removalPolicy?: RemovalPolicy;
}