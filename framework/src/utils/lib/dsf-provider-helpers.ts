// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from "aws-cdk-lib";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";


export function createLogGroup(
    scope: Construct, 
    id: string, 
    removalPolicy: RemovalPolicy,
    retention: RetentionDays,
    logEncryptionKey?: Key,
    logGroupName?: string) : LogGroup {

    let logGroup: LogGroup = new LogGroup (scope, id, {
        logGroupName: logGroupName,
        retention: retention,
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

//Attach policy to role
//policy passed by the user and cloudwatch write permission based on the cloudwatch created in the Provider