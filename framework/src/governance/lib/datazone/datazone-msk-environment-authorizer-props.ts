import { RemovalPolicy } from 'aws-cdk-lib';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';

export interface DataZoneMskEnvironmentAuthorizerProps {
  /**
   * The DataZone Domain ID
   */
  readonly domainId: string;
  /**
   * The Step Function State Machine from the DataZoneMskCentralAuthorizer
   */
  readonly centralAuthorizerStateMachine: IStateMachine;

  readonly removalPolicy?: RemovalPolicy;
}