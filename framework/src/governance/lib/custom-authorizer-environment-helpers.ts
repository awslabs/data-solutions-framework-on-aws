import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { DefinitionBody, IStateMachine, JsonPath, StateMachine, TaskInput, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface AuthorizerEnvironmentWorflow{
  readonly stateMachine: IStateMachine;
  readonly callbackFunction: IFunction;
  readonly callbackRole: IRole;
  readonly eventRule: IRule;
  readonly eventRole: IRole;
  readonly deadLetterQueue: IQueue;
}

export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  id: string,
  authorizerName: string,
  grantFunction: IFunction,
  centralAuthorizerStateMachine: IStateMachine,
  workflowTimeout?: Duration,
  retryAttempts?: number,
  removalPolicy?: RemovalPolicy): AuthorizerEnvironmentWorflow {

  const DEFAULT_TIMEOUT = Duration.minutes(5);
  const DEFAULT_RETRY_ATTEMPTS = 0;

  const eventRule = new Rule(scope, `${id}EventRule`, {
    eventPattern: {
      source: [authorizerName],
    },
  });

  const grant = new LambdaInvoke(scope, `${id}Grant`, {
    lambdaFunction: grantFunction,
    resultPath: '$.GrantResult',
    taskTimeout: Timeout.duration(Duration.minutes(2)),
  });

  const callbackRole = new Role(scope, 'LambdaCallbackRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ],
  });

  callbackRole.addToPolicy(
    new PolicyStatement({
      actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
      resources: [centralAuthorizerStateMachine.stateMachineArn],
    }),
  );

  const callbackFunction = new Function(scope, 'CallbackFunction', {
    runtime: Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: Code.fromAsset(__dirname+'/resources/custom-authorizer-callback/'),
    role: callbackRole,
    timeout: Duration.seconds(5),
  });

  const authorizerFailureCallback = new LambdaInvoke(scope, `${id}FailureCallback`, {
    lambdaFunction: callbackFunction,
    payload: TaskInput.fromObject({
      TaskToken: JsonPath.stringAt('$.detail.value.TaskToken'),
      Status: 'failure',
      Error: JsonPath.stringAt('$.Error'),
      Cause: JsonPath.stringAt('$.Cause'),
    }),
  });

  grant.addCatch(authorizerFailureCallback);

  const authorizerSuccessCallback = new LambdaInvoke(scope, `${id}SuccessCallback`, {
    lambdaFunction: callbackFunction,
    payload: TaskInput.fromObject({
      TaskToken: JsonPath.stringAt('$.detail.value.TaskToken'),
      Status: 'success',
    }),
  });

  const stateMachineDefinition = grant
    .next(authorizerSuccessCallback);

  const stateMachine = new StateMachine(scope, `${id}StateMachine`, {
    definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
    timeout: workflowTimeout || DEFAULT_TIMEOUT,
    removalPolicy: removalPolicy || RemovalPolicy.RETAIN,
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

  return { stateMachine, callbackFunction, callbackRole, eventRule, eventRole, deadLetterQueue };
}