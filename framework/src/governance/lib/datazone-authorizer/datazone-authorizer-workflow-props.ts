import { RemovalPolicy } from "aws-cdk-lib";

export interface DataZoneAuthorizerWorkflowProps {
    readonly removalPolicy?: RemovalPolicy
}