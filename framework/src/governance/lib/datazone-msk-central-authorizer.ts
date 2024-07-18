import { Construct } from "constructs";
import { Context, TrackedConstruct, TrackedConstructProps } from "../../utils";
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { DataZoneMskCentralAuthorizerProps } from "./datazone-msk-central-authorizer-props";
import { authorizerCentralWorkflowSetup } from "./custom-authorizer-central-helpers";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Rule } from "aws-cdk-lib/aws-events";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";


export class DataZoneMskCentralAuthorizer extends TrackedConstruct {
  public readonly metadataCollectorRole: Role;
  public readonly metadataCollectorFunction: Function;
  public readonly datazoneCallbackRole: Role;
  public readonly datazoneCallbackFunction: Function;
  public readonly deadLetterQueue: Queue;
  public readonly eventRole : Role;
  public readonly eventRule: Rule;
  public readonly stateMachine: StateMachine;

  private readonly removalPolicy: RemovalPolicy;
  
  constructor(scope: Construct, id: string, props: DataZoneMskCentralAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskCentralAuthorizer.name,
    };
    
    super(scope, id, trackedConstructProps);
    
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy)
    
    // TODO scope down to the datazone domain
    this.metadataCollectorRole = new Role(this, "MetadataCollectorHandlerRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
          "DataZonePermissions": new PolicyDocument({
              statements: [
                  new PolicyStatement({
                      effect: Effect.ALLOW,
                      actions: [
                          "datazone:ListEnvironments",
                          "datazone:GetAsset"
                      ],
                      resources: ["*"]
                  })
              ]
          })
      }
    })

    // TODO update the logic in the lambda code
    this.metadataCollectorFunction = new Function(this, "MetadataCollectorHandler", {
      runtime: Runtime.NODEJS_LATEST,
      handler: "index.handler",
      code: Code.fromAsset(__dirname+"/resources/datazone-msk-authorizer-metadata-collector/"),
      role: this.metadataCollectorRole,
      timeout: Duration.seconds(30),
    })

    // TODO scope down permissions
    this.datazoneCallbackRole = new Role(this, "MetadataCollectorHandlerRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
          "DataZonePermissions": new PolicyDocument({
              statements: [
                  new PolicyStatement({
                      effect: Effect.ALLOW,
                      actions: [
                          "datazone:*"
                      ],
                      resources: ["*"]
                  })
              ]
          })
      }
    })

    // TODO update the logic in the lambda code
    this.datazoneCallbackFunction = new Function(this, "MetadataCollectorHandler", {
      runtime: Runtime.NODEJS_LATEST,
      handler: "index.handler",
      code: Code.fromAsset(__dirname+"/resources/datazone-msk-authorizer-metadata-collector/"),
      role: this.metadataCollectorRole,
      timeout: Duration.seconds(30),
    })

    const datazonePattern = {
      "source": ["aws.datazone"],
      "detail-type": ["Subscription Grant Completed"],
      "detail": {
        "metadata": {
          "domain": props.domainId,
        }
      }
    }

    const customAuthorizer = authorizerCentralWorkflowSetup(this, 
      'DataZoneMskCentralWorkflow', 
      'mskTopicsIam', 
      this.metadataCollectorFunction,
      this.datazoneCallbackFunction,
      datazonePattern,
      Duration.minutes(5),
      0,
      this.removalPolicy
    )

    this.deadLetterQueue = customAuthorizer.deadLetterQueue;
    this.eventRole = customAuthorizer.eventRole;
    this.eventRule = customAuthorizer.eventRule;
    this.stateMachine = customAuthorizer.stateMachine;
  }
}