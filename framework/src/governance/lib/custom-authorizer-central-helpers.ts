// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnEventBusPolicy, EventBus, EventPattern, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction, SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IntegrationPattern, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { Utils } from '../../utils';

export interface AuthorizerCentralWorflow{
  readonly stateMachine: StateMachine;
  readonly deadLetterQueue: IQueue;
  readonly authorizerEventRule: IRule;
  readonly authorizerEventRole: IRole;
  readonly callbackEventRule: IRule;
  readonly callbackFunction: IFunction;
  readonly callbackRole: IRole;
}

enum GrantType{
  CONSUMER='consumerGrant',
  PRODUCER='producerGrant'
}

export function authorizerCentralWorkflowSetup(
  scope: Construct,
  id: string,
  authorizerName: string,
  metadataCollectorFunction: IFunction,
  governanceCallbackFunction: IFunction,
  eventPattern: EventPattern,
  workflowTimeout?: Duration,
  retryAttempts?: number,
  removalPolicy?: RemovalPolicy): AuthorizerCentralWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;

  const authorizerEventRule = new Rule(scope, `${id}AuthorizerEventRule`, {
    eventPattern,
  });

  const authorizerEventRole = new Role(scope, 'AuthorizerEventRole', {
    assumedBy: new ServicePrincipal('events.amazonaws.com'),
  });

  const callbackEventRule = new Rule(scope, `${id}CallbackEventRule`, {
    eventPattern: {
      source: [authorizerName],
      detailType: ['callback'],
    },
  });

  const metadataCollector = new LambdaInvoke(scope, `${id}MetadataCollector`, {
    lambdaFunction: metadataCollectorFunction,
    resultSelector: { 'Metadata.$': '$.Payload' },
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  const invokeProducerGrant = invokeGrant(scope, 'ProducerGrant', authorizerName, GrantType.PRODUCER);

  const invokeConsumerGrant = invokeGrant(scope, 'ConsumerGrant', authorizerName, GrantType.CONSUMER);

  const governanceSuccessCallback = new LambdaInvoke(scope, `${id}GovernanceSuccessCallback`, {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      Status: 'success',
      Metadata: JsonPath.stringAt('$.Metadata'),
    }),
  });

  const governanceFailureCallback = new LambdaInvoke(scope, `${id}GovernanceFailureCallback`, {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      Status: 'failure',
      Metadata: JsonPath.stringAt('$.Metadata'),
      Error: JsonPath.stringAt('$.Error'),
      Cause: JsonPath.stringAt('$.Cause'),
    }),
  });

  metadataCollector.addCatch(governanceFailureCallback, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  invokeProducerGrant.addCatch(governanceFailureCallback, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  invokeConsumerGrant.addCatch(governanceFailureCallback, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  const stateMachineDefinition = metadataCollector
    .next(invokeProducerGrant)
    .next(invokeConsumerGrant)
    .next(governanceSuccessCallback);

  const stateMachine = new StateMachine(scope, `${id}StateMachine`, {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  const deadLetterQueue = new Queue(scope, 'Queue');

  stateMachine.grantStartExecution(authorizerEventRole);

  authorizerEventRule.addTarget(new SfnStateMachine(stateMachine, {
    deadLetterQueue,
    role: authorizerEventRole,
    retryAttempts: retryAttempts || DEFAULT_RETRY_ATTEMPTS,
  }));

  const callbackRole = new Role(scope, 'LambdaCallbackRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ],
  });

  callbackRole.addToPolicy(
    new PolicyStatement({
      actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
      resources: [stateMachine.stateMachineArn],
    }),
  );

  const callbackFunction = new Function(scope, 'CallbackFunction', {
    runtime: Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: Code.fromAsset(__dirname+'/resources/custom-authorizer-callback/'),
    role: callbackRole,
    timeout: Duration.seconds(5),
  });

  stateMachine.grantTaskResponse(callbackRole);

  callbackEventRule.addTarget(new LambdaFunction(callbackFunction, {
    deadLetterQueue,
    maxEventAge: Duration.hours(1),
    retryAttempts: 10,
  }));

  grantPutEvents(scope, Stack.of(scope).account, stateMachine.role);

  return { stateMachine, deadLetterQueue, authorizerEventRule, authorizerEventRole, callbackEventRule, callbackFunction, callbackRole };
}

export function grantPutEvents(scope: Construct, accountId: string, role: IRole) {

  const targetEventBus = EventBus.fromEventBusArn(
    scope,
    `${accountId}CentralEventBus`,
    `arn:${Stack.of(scope).partition}:events:${Stack.of(scope).region}:${accountId}:event-bus/default`,
  );

  targetEventBus.grantPutEventsTo(role);
}

export function registerAccount(scope: Construct, id: string, accountId: string, role: IRole): CfnEventBusPolicy {

  grantPutEvents(scope, accountId, role);

  return new CfnEventBusPolicy(scope, `${accountId}${id}CentralEventBusPolicy`, {
    statementId: Utils.stringSanitizer(accountId + id),
    action: 'events:PutEvents',
    principal: accountId,
    eventBusName: 'default',
  });
};

function invokeGrant(scope: Construct, id: string, authorizerName: string, grantType: GrantType): CallAwsService {

  const eventBusName = grantType === GrantType.CONSUMER ?
    JsonPath.format('arn:aws:events:{}:{}:event-bus/default', JsonPath.stringAt('$.Metadata.Consumer.Region'), JsonPath.stringAt('$.Metadata.Consumer.Account')) :
    JsonPath.format('arn:aws:events:{}:{}:event-bus/default', JsonPath.stringAt('$.Metadata.Producer.Region'), JsonPath.stringAt('$.Metadata.Producer.Account'));

  return new CallAwsService(scope, `${id}EventBridgePutEvents`, {
    service: 'eventbridge',
    action: 'putEvents',
    parameters: {
      Entries: [{
        Detail: TaskInput.fromObject({
          TaskToken: JsonPath.taskToken,
          Metadata: JsonPath.objectAt('$.Metadata'),
        }),
        DetailType: grantType,
        Source: authorizerName,
        EventBusName: eventBusName,
      }],
    },
    iamResources: ['*'],
    integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    taskTimeout: Timeout.duration(Duration.minutes(5)),
    resultPath: JsonPath.DISCARD,
  });
}