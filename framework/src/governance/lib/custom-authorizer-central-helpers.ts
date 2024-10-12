// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arn, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { EventPattern, IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { AccountPrincipal, IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DefinitionBody, Fail, IntegrationPattern, JsonPath, Pass, StateMachine, TaskInput, TaskRole, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';


/**
 * Interface for the authorizer central workflow
 */
export interface AuthorizerCentralWorflow{
  /**
   * The authorizer Step Functions state machine
   */
  readonly stateMachine: StateMachine;
  /**
   * The IAM Role used by the State Machine
   */
  readonly stateMachineRole: Role;
  /**
   * The CloudWatch Log Group for logging the state machine
   */
  readonly stateMachineLogGroup: ILogGroup;
  /**
   * The IAM Role used by the State Machine Call Back
   */
  readonly callbackRole: Role;
  /**
   * The authorizer event rule for triggering the workflow
   */
  readonly authorizerEventRule: IRule;
  /**
   * The authorizer event role for allowing events to invoke the workflow
   */
  readonly authorizerEventRole: IRole;
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
 * @param logRetention The retention period for the created logs. @default - 1 week
 * @param authorizerEventRole The IAM role for the authorizer event rule. @default - A new role will be created
 * @param stateMachineRole The IAM role for the authorizer workflow. @default - A new role will be created
 * @param callbackRole The IAM role for the authorizer callback. @default - A new role will be created
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
  logRetention?: RetentionDays,
  authorizerEventRole?: Role,
  stateMachineRole?: Role,
  callbackRole?: Role,
  removalPolicy?: RemovalPolicy): AuthorizerCentralWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;
  const DEFAULT_LOGS_RETENTION = RetentionDays.ONE_WEEK;

  const authorizerEventRule = new Rule(scope, 'AuthorizerEventRule', {
    eventPattern,
  });

  const eventRole = authorizerEventRole || new Role(scope, 'SourceEventRole', {
    assumedBy: new ServicePrincipal('events.amazonaws.com'),
  });

  const metadataCollector = new LambdaInvoke(scope, 'MetadataCollector', {
    lambdaFunction: metadataCollectorFunction,
    resultSelector: { 'Metadata.$': '$.Payload' },
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  const envMetadataProcess = new Pass(scope, 'EnvironementMetadataProcess', {
    parameters: {
      Producer: {
        StateMachineRole: JsonPath.format(
          `arn:{}:iam::{}:role/${authorizerName}EnvironmentStateMachine`,
          JsonPath.stringAt('$.Metadata.Producer.Partition'),
          JsonPath.stringAt('$.Metadata.Producer.Account'),
        ),
        StateMachineArn: JsonPath.format(
          `arn:{}:states:{}:{}:stateMachine:${authorizerName}Environment`,
          JsonPath.stringAt('$.Metadata.Producer.Partition'),
          JsonPath.stringAt('$.Metadata.Producer.Region'),
          JsonPath.stringAt('$.Metadata.Producer.Account'),
        ),
      },
      Consumer: {
        StateMachineRole: JsonPath.format(
          `arn:{}:iam::{}:role/${authorizerName}EnvironmentStateMachine`,
          JsonPath.stringAt('$.Metadata.Consumer.Partition'),
          JsonPath.stringAt('$.Metadata.Consumer.Account'),
        ),
        StateMachineArn: JsonPath.format(
          `arn:{}:states:{}:{}:stateMachine:${authorizerName}Environment`,
          JsonPath.stringAt('$.Metadata.Consumer.Partition'),
          JsonPath.stringAt('$.Metadata.Consumer.Region'),
          JsonPath.stringAt('$.Metadata.Consumer.Account'),
        ),
      },
    },
    resultPath: '$.WorkflowMetadata',
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
    resultPath: '$.CallBackResult',
  });

  const failure = governanceFailureCallback.next(new Fail(scope, 'CentralWorfklowFailure', {
    errorPath: '$.ErrorInfo.Error',
    causePath: '$.ErrorInfo.Cause',
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
    .next(envMetadataProcess)
    .next(invokeProducerGrant)
    .next(invokeConsumerGrant)
    .next(governanceSuccessCallback);

  const stateRole = stateMachineRole || new Role(scope, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
    roleName: `${authorizerName}CentralStateMachine`,
  });

  const stateMachineLogGroup = new LogGroup(scope, 'StateMachineLogGroup', {
    removalPolicy,
    retention: logRetention || DEFAULT_LOGS_RETENTION,
  });

  const stateMachine = new StateMachine(scope, 'StateMachine', {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
    role: stateRole,
    stateMachineName: `${authorizerName}Central`,
    logs: {
      destination: stateMachineLogGroup,
    },
  });


  stateMachine.grantStartExecution(eventRole);

  authorizerEventRule.addTarget(new SfnStateMachine(stateMachine, {
    role: eventRole,
    retryAttempts: retryAttempts || DEFAULT_RETRY_ATTEMPTS,
  }));

  const callBackRole = callbackRole || new Role(scope, 'CallbackRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
    roleName: `${authorizerName}CentralCallback`,
  });

  stateMachine.grantTaskResponse(callBackRole);

  registerAccount(scope, 'SelfRegisterAccount', Stack.of(scope).account, authorizerName, stateRole, callBackRole);

  return {
    stateMachine,
    stateMachineRole: stateRole,
    stateMachineLogGroup,
    callbackRole: callBackRole,
    authorizerEventRule,
    authorizerEventRole: eventRole,
  };
}

/**
 * Register an account into a central authorizer workflow to allow cross account communication.
 * @param scope The scope of created resources
 * @param id The id of the created resources
 * @param accountId The account ID to register with the central authorizer
 * @param role The role to grant access to
 * @returns The CfnEventBusPolicy created to grant the account
 */
export function registerAccount(scope: Construct, id: string, accountId: string, authorizerName: string, invokeRole: Role, callbackRole: Role) {

  const stack = Stack.of(scope);

  const targetRole = Role.fromRoleArn(scope, `${id}EnvironmentStateMachineRole`,
    Arn.format({
      account: accountId,
      region: '',
      service: 'iam',
      resource: 'role',
      resourceName: `${authorizerName}EnvironmentStateMachine`,
    }, stack), {
      mutable: false,
      addGrantsToResources: true,
    },
  );

  callbackRole.assumeRolePolicy?.addStatements(
    new PolicyStatement({
      actions: ['sts:AssumeRole'],
      principals: [new AccountPrincipal(accountId)],
      conditions: {
        StringEquals: {
          'sts:ExternalId': `arn:${stack.partition}:states:${stack.region}:${accountId}:stateMachine:${authorizerName}Environment`,
        },
      },
    },
    ));

  targetRole.grantAssumeRole(invokeRole);
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

  return new CallAwsService(scope, `${id}StateMachineExecution`, {
    service: 'sfn',
    action: 'startExecution',
    parameters: {
      StateMachineArn: JsonPath.stringAt(
        grantType === GrantType.CONSUMER ?
          '$.WorkflowMetadata.Consumer.StateMachineArn' :
          '$.WorkflowMetadata.Producer.StateMachineArn',
      ),
      Input: {
        Metadata: JsonPath.objectAt('$.Metadata'),
        GrantType: grantType,
        AuthorizerName: authorizerName,
        TaskToken: JsonPath.taskToken,
      },
    },
    credentials: {
      role: TaskRole.fromRoleArnJsonPath(
        grantType === GrantType.CONSUMER ?
          '$.WorkflowMetadata.Consumer.StateMachineRole' :
          '$.WorkflowMetadata.Producer.StateMachineRole',
      ),
    },
    iamResources: [`arn:${Stack.of(scope).partition}:states:${Stack.of(scope).region}:*:stateMachine:${authorizerName}Environment`],
    integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    taskTimeout: Timeout.duration(Duration.minutes(5)),
    resultPath: JsonPath.DISCARD,
  });
}