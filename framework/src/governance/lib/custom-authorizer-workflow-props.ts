import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface CustomAuthorizerWorkflowProps {
    metadataCollectorFunction: IFunction
    producerGrantFunction: IFunction
    consumerGrantFunction: IFunction
    governanceCallbackFunction: IFunction
    workflowTimeout?: Duration
}