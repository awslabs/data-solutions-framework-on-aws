import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { EventPattern, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IntegrationPattern, IStateMachine, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface AuthorizerCentralWorflow{
  readonly stateMachine: IStateMachine;
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
    resultPath: '$.metadata',
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  const invokeProducerGrant = invokeGrant(scope, 'ProducerGrant', authorizerName, GrantType.PRODUCER);

  const invokeConsumerGrant = invokeGrant(scope, 'ConsumerGrant', authorizerName, GrantType.CONSUMER);

  const governanceSuccessCallback = new LambdaInvoke(scope, `${id}GovernanceSuccessCallback`, {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      status: 'succeed',
      metadata: JsonPath.stringAt('$.metadata'),
    }),
  });

  const governanceFailureCallback = new LambdaInvoke(scope, `${id}GovernanceFailureCallback`, {
    lambdaFunction: governanceCallbackFunction,
    taskTimeout: Timeout.duration(Duration.minutes(1)),
    payload: TaskInput.fromObject({
      status: 'fail',
      metadata: JsonPath.stringAt('$.metadata'),
      error: JsonPath.stringAt('$.Error'),
      cause: JsonPath.stringAt('$.Cause'),
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

function invokeGrant(scope: Construct, id: string, authorizerName: string, grantType: GrantType): CallAwsService {

  const eventBusName = grantType === GrantType.CONSUMER ?
    JsonPath.format('arn:aws:events:{}:{}:event-bus/default', JsonPath.stringAt('$.metadata.consumer.region'), JsonPath.stringAt('$.metadata.consumer.account')) :
    JsonPath.format('arn:aws:events:{}:{}:event-bus/default', JsonPath.stringAt('$.metadata.producer.region'), JsonPath.stringAt('$.metadata.producer.account'));

  return new CallAwsService(scope, `${id}EventBridgePutEvents`, {
    service: 'eventbridge',
    action: 'putEvents',
    parameters: {
      Entries: [{
        Detail: TaskInput.fromObject({
          taskToken: JsonPath.taskToken,
          metadata: JsonPath.stringAt('$.metadata'),
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