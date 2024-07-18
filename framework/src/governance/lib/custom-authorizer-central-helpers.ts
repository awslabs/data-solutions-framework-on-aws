import { Construct } from "constructs";
import { EventBridgePutEvents, LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { DefinitionBody, IntegrationPattern, JsonPath, StateMachine, TaskInput, Timeout } from "aws-cdk-lib/aws-stepfunctions";
import { Arn, Duration, RemovalPolicy } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { EventBus, EventPattern, Rule } from "aws-cdk-lib/aws-events";
import { SfnStateMachine } from "aws-cdk-lib/aws-events-targets";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export interface AuthorizerCentralWorflow{
  stateMachine: StateMachine,
  deadLetterQueue: Queue,
  eventRule: Rule,
  eventRole: Role
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
      resultPath: "$.metadata",
      taskTimeout: Timeout.duration(Duration.minutes(2)),
    });
    
    const invokeProducerGrant = new EventBridgePutEvents(scope, `${id}InvokeProducerGrant`, {
      entries: [{
        detail: TaskInput.fromObject({
          "taskToken": JsonPath.taskToken,
          "metadata": JsonPath.stringAt("$.metadata")
        }),
        detailType: 'producerGrant',
        source: authorizerName,
        eventBus: EventBus.fromEventBusArn(scope, 'producerEventBus', Arn.format({
          resource: 'event-bus',
          resourceName: 'default',
          service: 'events',
          partition: 'aws',
          account: JsonPath.stringAt("$.metadata.producerAccount"),
          region: JsonPath.stringAt("$.metadata.producerRegion"),
        })),
      }],
      integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      taskTimeout: Timeout.duration(Duration.minutes(5)),
    });

    const invokeConsumerGrant = new EventBridgePutEvents(scope, `${id}InvokeConsumerGrant`, {
      entries: [{
        detail: TaskInput.fromObject({
          "taskToken": JsonPath.taskToken,
          "metadata": JsonPath.stringAt("$.metadata")
        }),
        detailType: 'consumerGrant',
        source: authorizerName,
        eventBus: EventBus.fromEventBusArn(scope, 'consumerEventBus', Arn.format({
          resource: 'event-bus',
          resourceName: 'default',
          service: 'events',
          partition: 'aws',
          account: JsonPath.stringAt("$.metadata.consumerAccount"),
          region: JsonPath.stringAt("$.metadata.consumerRegion"),
        })),
      }],
      integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      taskTimeout: Timeout.duration(Duration.minutes(5)),
    });
    
    const governanceCallback = new LambdaInvoke(scope, `${id}GovernanceCallback`, {
      lambdaFunction: governanceCallbackFunction,
    });
    
    const stateMachineDefinition = metadataCollector
    .next(invokeProducerGrant)
    .next(invokeConsumerGrant)
    .next(governanceCallback);

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

    return {stateMachine, deadLetterQueue, eventRule, eventRole};
}