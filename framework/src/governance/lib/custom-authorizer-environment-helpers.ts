// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arn, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
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
}

/**
 * Setups the environment custom authorizer workflow.
 * This function creates the necessary grants for the central account to invoke the lambda function and assume the role.
 * @param scope The scope of the resources created
 * @param authorizerName The name of the authorizer
 * @param grantFunction The lambda function creating the grants
 * @param centralAccount The central account ID hosting the central authorizer workflow
 * @returns The created AuthorizerEnvironmentWorflow
 */
export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  authorizerName: string,
  grantFunction: IFunction,
  centralAccount?: string,
  workflowTimeout?: Duration,
  removalPolicy?: RemovalPolicy) : AuthorizerEnvironmentWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);

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

  const stateMachineRole = new Role(scope, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
    roleName: `${authorizerName}EnvironmentStateMachine`,
  });
    // TODO deny all except the state machine
    // grantFunction.addPermission()

  // grantFunction.grantInvoke(stateMachineRole);

  const stateMachine = new StateMachine(scope, 'StateMachine', {
    stateMachineName: stateMachineName,
    definitionBody: DefinitionBody.fromChainable(grantInvoke.next(successCallback)),
    role: stateMachineRole,
    timeout: workflowTimeout ?? DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  // const centralAuthorizerRole = Role.fromRoleArn(scope, 'CentralRole',
  //   Arn.format({
  //     account: centralAccount,
  //     region: '',
  //     resource: 'role',
  //     service: 'iam',
  //     resourceName: `${authorizerName}CentralStateMachine`,
  //   }, stack), {
  //     mutable: false,
  //     addGrantsToResources: true,
  //   },
  // );

  stateMachineRole.assumeRolePolicy?.addStatements(new PolicyStatement({
    actions: ['sts:AssumeRole'],
    principals: [new AccountPrincipal(centralAccount ?? stack.account)],
    conditions: {
      StringEquals: {
        'sts:ExternalId': `arn:${stack.partition}:states:${stack.region}:${centralAccount ?? stack.account}:stateMachine:${authorizerName}Central`,
      },
    },
  }));

  stateMachineRole.addToPolicy(new PolicyStatement({
    actions: ['states:StartExecution'],
    resources: [`arn:${stack.partition}:states:${stack.region}:${stack.account}:stateMachine:${stateMachineName}`],
  }));

  callbackRole.grantAssumeRole(stateMachineRole);

  return { stateMachine, stateMachineRole };
}