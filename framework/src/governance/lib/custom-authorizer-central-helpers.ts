import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { EventPattern, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { Effect, IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IntegrationPattern, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface AuthorizerCentralWorflow{
  readonly stateMachine: StateMachine;
  readonly deadLetterQueue: IQueue;
  readonly eventRule: IRule;
  readonly eventRole: IRole;
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

  const eventRule = new Rule(scope, `${id}EventRule`, {
    eventPattern,
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
  });

  invokeProducerGrant.addCatch(governanceFailureCallback, {
    errors: ['States.TaskFailed'],
  });

  invokeConsumerGrant.addCatch(governanceFailureCallback, {
    errors: ['States.TaskFailed'],
  });

  const stateMachineDefinition = metadataCollector
    .next(invokeProducerGrant)
    .next(invokeConsumerGrant)
    .next(governanceSuccessCallback);

  // const stateMachineRole = new Role(scope, `${id}StateMachineRole`, {
  //   assumedBy: new ServicePrincipal('states.amazonaws.com'),
  // });

  const stateMachine = new StateMachine(scope, `${id}StateMachine`, {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
    // role: stateMachineRole,
  });

  const deadLetterQueue = new Queue(scope, 'Queue');

  const eventRole = new Role(scope, 'Role', {
    assumedBy: new ServicePrincipal('events.amazonaws.com'),
  });
  stateMachine.grantStartExecution(eventRole);

  eventRule.addTarget(new SfnStateMachine(stateMachine, {
    deadLetterQueue,
    role: eventRole,
    retryAttempts: retryAttempts || DEFAULT_RETRY_ATTEMPTS,
  }));

  return { stateMachine, deadLetterQueue, eventRule, eventRole };
}

export function registerAccount(scope: Construct, accountId: string, stateMachine: StateMachine) {
  stateMachine.addToRolePolicy(new PolicyStatement({
    actions: ['events:PutEvents'],
    effect: Effect.ALLOW,
    resources: [`arn:aws:events:${Stack.of(scope).region}:${accountId}:event-bus/default`],
  }));
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