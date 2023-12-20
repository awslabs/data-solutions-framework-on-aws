// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Effect, IManagedPolicy, IRole, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


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


export function attachPolicyToRole (
  scope: Construct,
  id: string,
  role: IRole,
  log: ILogGroup,
  crPolicy?: Policy,
  crManagedPolicy?: IManagedPolicy) {

  if (
    crPolicy === undefined && crManagedPolicy === undefined ||
        crPolicy != undefined && crManagedPolicy != undefined
  ) {
    throw new Error('You must provide either Policy or Managed Policy');
  }

  const createLogStreamPolicy = new PolicyStatement({
    actions: ['logs:CreateLogStream'],
    resources: [`${log.logGroupArn}`],
    effect: Effect.ALLOW,
  });


  const putLogEventsPolicy = new PolicyStatement({
    actions: ['logs:PutLogEvents'],
    resources: [`${log.logGroupArn}:log-stream:*`],
    effect: Effect.ALLOW,
  });

  const basicExecutionRolePolicy = new Policy(scope, id, {
    statements: [createLogStreamPolicy, putLogEventsPolicy],
  });

  //Handle only ManagedPolicy and drop Policy
  //Add KMS key Encrypt action

  role.attachInlinePolicy(basicExecutionRolePolicy);

  if (crPolicy) {
    role.attachInlinePolicy(crPolicy);
  } else {
    role.addManagedPolicy(crManagedPolicy!);
  }

}