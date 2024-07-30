import { RemovalPolicy } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';

export interface DataZoneMSKProducerAuthorizerProps {
  readonly producerAuthorizerEventBus: EventBus;
  readonly removalPolicy?: RemovalPolicy;
}