import { RemovalPolicy } from "aws-cdk-lib";

export interface DataZoneMskEnvironmentAuthorizer {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;

  readonly removalPolicy?: RemovalPolicy;
}