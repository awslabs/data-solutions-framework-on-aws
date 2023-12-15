import { RemovalPolicy } from "aws-cdk-lib";
import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Key } from "aws-cdk-lib/aws-kms";
import { ILogGroup, LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";


export function createLogGroup(
    scope: Construct, 
    id: string, 
    removalPolicy: RemovalPolicy,
    logEncryptionKey?: Key,
    logGroupName?: string) : LogGroup {

    let logGroup: LogGroup = new LogGroup (scope, id, {
        logGroupName: logGroupName,
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: removalPolicy,
        encryptionKey: logEncryptionKey,
    });

    return logGroup;
}

export function createLambdaExecutionRole (scope: Construct, id: string) : Role {

    const role = new Role (scope, id, { 
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    return role;
}