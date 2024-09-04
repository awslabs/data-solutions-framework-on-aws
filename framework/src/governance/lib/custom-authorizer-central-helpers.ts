// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnEventBusPolicy, EventBus, EventPattern, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction, SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, Fail, IntegrationPattern, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { Utils } from '../../utils';

/**
 * Interface for the authorizer central workflow
 */
export interface AuthorizerCentralWorflow{
  /**
   * The authorizer Step Functions state machine
   */
  readonly stateMachine: StateMachine;
  /**
   * The authorizer dead letter queue for failed events
   */
  readonly deadLetterQueue: IQueue;
  /**
   * The authorizer event rule for triggering the workflow
   */
  readonly authorizerEventRule: IRule;
  /**
   * The authorizer event role for allowing events to invoke the workflow
   */
  readonly authorizerEventRole: IRole;
  /**
   * The callback event rule for listening to producer and subscriber grants callback
   */
  readonly callbackEventRule: IRule;
  /**
   * The Lambda function for handling producer and subscriber grants callback
   */
  readonly callbackFunction: IFunction;
  /**
   * The role for the Lambda function handling producer and subscriber grants callback
   */
  readonly callbackRole: IRole;
}
/**
 * Grant type for the authorizer workflow
 */
enum GrantType{
  CONSUMER='consumerGrant',
  PRODUCER='producerGrant'
}

/**
 * Create the resources used by a central authorizer workflow.
 * @param scope The scope creating the resources
 * @param authorizerName The name of the authorizer
 * @param metadataCollectorFunction The Lambda function collecting metadata from the governance tool
 * @param governanceCallbackFunction The Lambda function acknowledging the grant in the governance tool
 * @param eventPattern The event pattern for triggering the authorizer workflow
 * @param workflowTimeout The timeout for the authorizer workflow. @default - 5 minutes
 * @param retryAttempts The number of retry attempts for the authorizer workflow. @default - No retry
 * @param removalPolicy The removal policy for the created resources. @default - RemovalPolicy.RETAIN
 * @returns The created AuthorizerCentralWorflow
 */
export function authorizerCentralWorkflowSetup(
  scope: Construct,
  authorizerName: string,
  metadataCollectorFunction: IFunction,
  governanceCallbackFunction: IFunction,
  eventPattern: EventPattern,
  workflowTimeout?: Duration,
  retryAttempts?: number,
  removalPolicy?: RemovalPolicy): AuthorizerCentralWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;

  const authorizerEventRule = new Rule(scope, 'AuthorizerEventRule', {
    eventPattern,
  });

  const authorizerEventRole = new Role(scope, 'SourceEventRole', {
    assumedBy: new ServicePrincipal('events.amazonaws.com'),
  });

  const callbackEventRule = new Rule(scope, 'CallbackEventRule', {
    eventPattern: {
      source: [authorizerName],
      detailType: ['callback'],
    },
  });

  const metadataCollector = new LambdaInvoke(scope, 'MetadataCollector', {
    lambdaFunction: metadataCollectorFunction,
    resultSelector: { 'Metadata.$': '$.Payload' },
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  const invokeProducerGrant = invokeGrant(scope, 'ProducerGrant', authorizerName, GrantType.PRODUCER);

  const invokeConsumerGrant = invokeGrant(scope, 'ConsumerGrant', authorizerName, GrantType.CONSUMER);

  const governanceSuccessCallback = new LambdaInvoke(scope, 'GovernanceSuccessCallback', {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      Status: 'success',
      Metadata: JsonPath.stringAt('$.Metadata'),
    }),
  });

  const governanceFailureCallback = new LambdaInvoke(scope, 'GovernanceFailureCallback', {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      Status: 'failure',
      Metadata: JsonPath.stringAt('$.Metadata'),
      Error: JsonPath.stringAt('$.ErrorInfo.Error'),
      Cause: JsonPath.stringAt('$.ErrorInfo.Cause'),
    }),
  });

  const failure = governanceFailureCallback.next(new Fail(scope, 'CentralWorfklowFailure', {
    errorPath: '$.ErrorInfo',
  }));

  metadataCollector.addCatch(failure, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  invokeProducerGrant.addCatch(failure, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  invokeConsumerGrant.addCatch(failure, {
    errors: ['States.TaskFailed'],
    resultPath: '$.ErrorInfo',
  });

  const stateMachineDefinition = metadataCollector
    .next(invokeProducerGrant)
    .next(invokeConsumerGrant)
    .next(governanceSuccessCallback);

  const stateMachine = new StateMachine(scope, 'StateMachine', {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  const deadLetterQueue = new Queue(scope, 'Queue', {
    enforceSSL: true,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

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

  // grantPutEvents(scope, Stack.of(scope).account, stateMachine.role);

  return { stateMachine, deadLetterQueue, authorizerEventRule, authorizerEventRole, callbackEventRule, callbackFunction, callbackRole };
}

/**
 * Grant a role to put events in the default Event Bridge bus of an account.
 * This method adds an IAM role policy but doesn't modify the Event Bridge bus resource policy.
 * @param scope The scope creating the resources
 * @param accountId The account ID of the default Event Bridge bus
 * @param role The role to grant access to
 */
export function grantPutEvents(scope: Construct, accountId: string, role: IRole) {

  const targetEventBus = EventBus.fromEventBusArn(
    scope,
    `${accountId}CentralEventBus`,
    `arn:${Stack.of(scope).partition}:events:${Stack.of(scope).region}:${accountId}:event-bus/default`,
  );

  targetEventBus.grantPutEventsTo(role);
}

/**
 * Register an account into a central authorizer workflow to allow cross account communication.
 * @param scope The scope of created resources
 * @param id The id of the created resources
 * @param accountId The account ID to register with the central authorizer
 * @param role The role to grant access to
 * @returns The CfnEventBusPolicy created to grant the account
 */
export function registerAccount(scope: Construct, id: string, accountId: string, role: IRole): CfnEventBusPolicy {

  grantPutEvents(scope, accountId, role);

  return new CfnEventBusPolicy(scope, `${accountId}${id}CentralEventBusPolicy`, {
    statementId: Utils.stringSanitizer(accountId + id),
    action: 'events:PutEvents',
    principal: accountId,
    eventBusName: 'default',
  });
};

/**
 * Creates a Step Functions task to invoke GRANT and REVOKE via Event Bridge events
 * @param scope The scope of created resources
 * @param id The id of the created resources
 * @param authorizerName The name of the authorizer
 * @param grantType The grant type (GRANT or REVOKE)
 * @returns The CallAwsService task to use in the Step Functions state machine
 */
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
    iamResources: [`arn:aws:events:${Stack.of(scope).region}:${Stack.of(scope).region}:event-bus/default`],
    integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    taskTimeout: Timeout.duration(Duration.minutes(5)),
    resultPath: JsonPath.DISCARD,
  });
}