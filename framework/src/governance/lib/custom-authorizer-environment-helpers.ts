import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnEventBusPolicy, EventBus, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IStateMachine, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { EventBridgePutEvents, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface AuthorizerEnvironmentWorflow{
  readonly stateMachine: IStateMachine;
  readonly eventRule: IRule;
  readonly eventRole: IRole;
  readonly deadLetterQueue: IQueue;
  readonly eventBusPolicy?: CfnEventBusPolicy;
}

export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  id: string,
  authorizerName: string,
  grantFunction: IFunction,
  centralAccount?: string,
  workflowTimeout?: Duration,
  retryAttempts?: number,
  removalPolicy?: RemovalPolicy): AuthorizerEnvironmentWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;

  const eventRule = new Rule(scope, `${id}EventRule`, {
    eventPattern: {
      source: [authorizerName],
      detailType: ['producerGrant', 'consumerGrant'],
    },
  });

  const grant = new LambdaInvoke(scope, `${id}Grant`, {
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
    scope, `
    ${id}CentralEventBus`,
    `arn:${Stack.of(scope).partition}:events:${Stack.of(scope).region}:${eventBusAccount}:event-bus/default`,
  );

  const authorizerFailureCallbackEvent = new EventBridgePutEvents(scope, `${id}FailureCallback`, {
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

  const authorizerSuccessCallbackEvent = new EventBridgePutEvents(scope, `${id}SuccessCallback`, {
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

  const stateMachine = new StateMachine(scope, `${id}StateMachine`, {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
  });

  centralEventBus.grantPutEventsTo(stateMachine.role);

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

  return { stateMachine, eventRule, eventRole, deadLetterQueue, eventBusPolicy };
}