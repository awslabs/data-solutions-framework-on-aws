import { Function } from "aws-cdk-lib/aws-lambda";

export interface SubscriptionAssetTypeHandler {
    handler(): Function
}