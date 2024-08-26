import { Function } from 'aws-cdk-lib/aws-lambda';

export interface SubscriptionAssetTypeHandler {
  producerHandler(): Function;
  consumerHandler(): Function;
}