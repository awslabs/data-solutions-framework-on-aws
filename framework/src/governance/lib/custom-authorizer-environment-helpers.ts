// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arn, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DefinitionBody, Fail, IntegrationPattern, IStateMachine, JsonPath, StateMachine, TaskRole, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

/**
 * The interface representing the environment custom authorizer workflow.
 */
export interface AuthorizerEnvironmentWorflow{
  /**
   * The state machine that orchestrates the workflow.
   */
  readonly stateMachine: IStateMachine;
  /**
   * The IAM Role used by the State Machine
   */
  readonly stateMachineRole: IRole;
  /**
   * The log group where the state machine logs are stored.
   */
  readonly stateMachineLogGroup: ILogGroup;
}

/**
 * Setups the environment custom authorizer workflow.
 * This function creates the necessary grants for the central account to invoke the lambda function and assume the role.
 * @param scope The scope of the resources created
 * @param authorizerName The name of the authorizer
 * @param grantFunction The lambda function creating the grants
 * @param centralAccount The central account ID hosting the central authorizer workflow @default - The same account is used
 * @param stateMachineRole The role used by the Step Functions state machine @default - A new role is created
 * @param workflowTimeout The timeout for the state machine workflow. @default - 5 minutes
 * @param logRetention The retention period for the created logs. @default - 1 week
 * @returns The created AuthorizerEnvironmentWorflow
 */
export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  authorizerName: string,
  grantFunction: IFunction,
  stateMachineRole?: Role,
  centralAccount?: string,
  workflowTimeout?: Duration,
  logRetention?: RetentionDays,
  removalPolicy?: RemovalPolicy) : AuthorizerEnvironmentWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_LOGS_RETENTION = RetentionDays.ONE_WEEK;

  const stack = Stack.of(scope);

  const stateMachineName = `${authorizerName}Environment`;

  const grantInvoke = new LambdaInvoke(scope, 'GrantInvoke', {
    lambdaFunction: grantFunction,
    resultPath: '$.GrantResult',
    taskTimeout: Timeout.duration(workflowTimeout ?? DEFAULT_TIMEOUT),
  });

  const callbackRole = Role.fromRoleArn(scope, 'CallbackRole',
    Arn.format({
      account: centralAccount,
      region: '',
      resource: 'role',
      service: 'iam',
      resourceName: `${authorizerName}CentralCallback`,
    }, stack), {
      mutable: false,
      addGrantsToResources: true,
    },
  );

  const successCallback = new CallAwsService(scope, 'SuccessCallback', {
    service: 'sfn',
    action: 'sendTaskSuccess',
    parameters: {
      TaskToken: JsonPath.stringAt('$.TaskToken'),
      Output: JsonPath.stringAt('$.GrantResult'),
    },
    credentials: {
      role: TaskRole.fromRole(callbackRole),
    },
    iamResources: [`arn:${stack.partition}:states:${stack.region}:${centralAccount || stack.account}:stateMachine:${authorizerName}Central`],
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    taskTimeout: Timeout.duration(Duration.seconds(10)),
    resultPath: JsonPath.DISCARD,
  });

  const failureCallBack = new CallAwsService(scope, 'FailureCallback', {
    service: 'sfn',
    action: 'sendTaskFailure',
    parameters: {
      TaskToken: JsonPath.stringAt('$.TaskToken'),
      Error: JsonPath.stringAt('$.ErrorInfo.Error'),
      Cause: JsonPath.stringAt('$.ErrorInfo.Cause'),
    },
    credentials: {
      role: TaskRole.fromRole(callbackRole),
    },
    iamResources: [`arn:${stack.partition}:states:${stack.region}:${centralAccount || stack.account}:stateMachine:${authorizerName}Central`],
    integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
    taskTimeout: Timeout.duration(Duration.seconds(10)),
    resultPath: JsonPath.DISCARD,
  });

  const failure = failureCallBack.next(new Fail(scope, 'EnvironmentWorkflowFailure', {
    errorPath: '$.ErrorInfoError',
    causePath: '$.ErrorInfo.Cause',
  }));

  grantInvoke.addCatch(failure, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  const stateRole = stateMachineRole || new Role(scope, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
    roleName: `${authorizerName}EnvironmentStateMachine`,
  });

  const stateMachineLogGroup = new LogGroup(scope, 'StateMachineLogGroup', {
    removalPolicy,
    retention: logRetention || DEFAULT_LOGS_RETENTION,
  });

  const stateMachine = new StateMachine(scope, 'StateMachine', {
    stateMachineName: stateMachineName,
    definitionBody: DefinitionBody.fromChainable(grantInvoke.next(successCallback)),
    role: stateRole,
    timeout: workflowTimeout ?? DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
    logs: {
      destination: stateMachineLogGroup,
    },
  });

  stateRole.assumeRolePolicy?.addStatements(new PolicyStatement({
    actions: ['sts:AssumeRole'],
    principals: [new AccountPrincipal(centralAccount ?? stack.account)],
    conditions: {
      StringEquals: {
        'sts:ExternalId': `arn:${stack.partition}:states:${stack.region}:${centralAccount ?? stack.account}:stateMachine:${authorizerName}Central`,
      },
    },
  }));

  stateRole.addToPolicy(new PolicyStatement({
    actions: ['states:StartExecution'],
    resources: [`arn:${stack.partition}:states:${stack.region}:${stack.account}:stateMachine:${stateMachineName}`],
  }));

  callbackRole.grantAssumeRole(stateRole);

  return { stateMachine, stateMachineRole: stateRole, stateMachineLogGroup };
}