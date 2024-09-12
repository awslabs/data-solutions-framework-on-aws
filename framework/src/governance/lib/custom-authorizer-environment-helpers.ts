// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnEventBusPolicy, EventBus, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IStateMachine, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { EventBridgePutEvents, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
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
   * The event rule that triggers the workflow.
   */
  readonly eventRule: IRule;
  /**
   * The role used by the even rule to trigger the Step Function state machine.
   */
  readonly eventRole: IRole;
  /**
   * The dead letter queue for failed events.
   */
  readonly deadLetterQueue: IQueue;
  /**
   * The optional event bus policy for cross-account workflows.
   */
  readonly eventBusPolicy?: CfnEventBusPolicy;
}

/**
 *
 * @param scope The scope of the resources created
 * @param authorizerName The name of the authorizer
 * @param grantFunction The lambda function creating the grants
 * @param centralAccount The central account ID hosting the central authorizer workflow
 * @param workflowTimeout The timeout for the authorizer workflow. @default - 5 minutes
 * @param retryAttempts The number of retry attempts for the authorizer workflow. @default - No retry
 * @param removalPolicy The removal policy for the created resources. @default - RemovalPolicy.RETAIN
 * @returns The created AuthorizerEnvironmentWorflow
 */
export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  authorizerName: string,
  grantFunction: IFunction,
  centralAccount?: string,
  workflowTimeout?: Duration,
  retryAttempts?: number,
  removalPolicy?: RemovalPolicy): AuthorizerEnvironmentWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;

  const eventRule = new Rule(scope, 'CentralEventRule', {
    eventPattern: {
      source: [authorizerName],
      detailType: ['producerGrant', 'consumerGrant'],
    },
  });

  const grant = new LambdaInvoke(scope, 'GrantInvoke', {
    lambdaFunction: grantFunction,
    resultPath: '$.GrantResult',
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  let eventBusPolicy: CfnEventBusPolicy | undefined = undefined;

  if (centralAccount !== undefined) {
    eventBusPolicy = new CfnEventBusPolicy(scope, `${centralAccount}EnvEventBusPolicy`, {
      statementId: centralAccount,
      action: 'events:PutEvents',
      principal: centralAccount,
      eventBusName: 'default',
    });
  }
  const eventBusAccount = centralAccount || Stack.of(scope).account;

  const centralEventBus = EventBus.fromEventBusArn(
    scope,
    'CentralEventBus',
    `arn:${Stack.of(scope).partition}:events:${Stack.of(scope).region}:${eventBusAccount}:event-bus/default`,
  );

  const authorizerFailureCallbackEvent = new EventBridgePutEvents(scope, 'FailureCallback', {
    entries: [{
      detail: TaskInput.fromObject({
        TaskToken: JsonPath.stringAt('$.detail.value.TaskToken'),
        Status: 'failure',
        Error: JsonPath.stringAt('$.ErrorInfo.Error'),
        Cause: JsonPath.stringAt('$.ErrorInfo.Cause'),
      }),
      eventBus: centralEventBus,
      detailType: 'callback',
      source: authorizerName,
    }],
  });

  grant.addCatch(authorizerFailureCallbackEvent, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  const authorizerSuccessCallbackEvent = new EventBridgePutEvents(scope, 'SuccessCallback', {
    entries: [{
      detail: TaskInput.fromObject({
        TaskToken: JsonPath.stringAt('$.detail.value.TaskToken'),
        Status: 'success',
      }),
      eventBus: centralEventBus,
      detailType: 'callback',
      source: authorizerName,
    }],
  });

  const stateMachineDefinition = grant
    .next(authorizerSuccessCallbackEvent);

  const stateMachine = new StateMachine(scope, 'StateMachine', {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  centralEventBus.grantPutEventsTo(stateMachine.role);

  const deadLetterQueue = new Queue(scope, 'Queue', {
    enforceSSL: true,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  const eventRole = new Role(scope, 'CentralEventRole', {
    assumedBy: new ServicePrincipal('events.amazonaws.com'),
  });
  stateMachine.grantStartExecution(eventRole);

  eventRule.addTarget(new SfnStateMachine(stateMachine, {
    deadLetterQueue,
    role: eventRole,
    retryAttempts: retryAttempts || DEFAULT_RETRY_ATTEMPTS,
  }));

  return { stateMachine, eventRule, eventRole, deadLetterQueue, eventBusPolicy };
}