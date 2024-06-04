import { Construct } from "constructs";
import { TrackedConstruct, TrackedConstructProps } from "../../utils";
import { CustomAuthorizerWorkflowProps } from "./custom-authorizer-workflow-props";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { DefinitionBody, IntegrationPattern, JsonPath, StateMachine, TaskInput } from "aws-cdk-lib/aws-stepfunctions";
import { Duration } from "aws-cdk-lib";

export class CustomAuthorizerWorkflow extends TrackedConstruct {
    readonly stateMachine: StateMachine

    constructor(scope: Construct, id: string, props: CustomAuthorizerWorkflowProps) {
        const trackedConstructProps: TrackedConstructProps = {
            trackingTag: CustomAuthorizerWorkflow.name,
        };

        super(scope, id, trackedConstructProps);

        const invokeMetadataCollector = new LambdaInvoke(this, "InvokeMetadataCollector", {
            lambdaFunction: props.metadataCollectorFunction,
            resultPath: "$.metadata"
        })

        const invokeProducerGrant = new LambdaInvoke(this, "InvokeProducerGrant", {
            lambdaFunction: props.producerGrantFunction,
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            resultPath: "$.producerGrant",
            payload: TaskInput.fromObject({
                "taskToken": JsonPath.taskToken,
                "metadata": JsonPath.stringAt("$.metadata")
            })
        })

        const invokeConsumerGrant = new LambdaInvoke(this, "InvokeConsumerGrant", {
            lambdaFunction: props.consumerGrantFunction,
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            resultPath: "$.consumerGrant",
            payload: TaskInput.fromObject({
                "taskToken": JsonPath.taskToken,
                "metadata": JsonPath.stringAt("$.metadata"),
                "producerGrant": JsonPath.stringAt("$.producerGrant")
            })
        })

        const invokeGovernanceCallback = new LambdaInvoke(this, "InvokeGovernanceCallback", {
            lambdaFunction: props.governanceCallbackFunction,
            resultPath: "$.governanceCallback"
        })

        const stateMachineDefinition = invokeMetadataCollector
            .next(invokeProducerGrant)
            .next(invokeConsumerGrant)
            .next(invokeGovernanceCallback);

        this.stateMachine = new StateMachine(this, `${id}-StateMachine`, {
            definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
            timeout: props.workflowTimeout || Duration.minutes(5)
        })
    }
}