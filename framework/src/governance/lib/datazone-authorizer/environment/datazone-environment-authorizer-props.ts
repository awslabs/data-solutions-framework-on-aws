import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneEnvironmentAuthorizerProps {
  readonly centralAccountId: string;
  readonly removalPolicy?: RemovalPolicy;
}