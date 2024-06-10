import { Construct } from "constructs";
import { TrackedConstruct, TrackedConstructProps } from "../../../../utils";
import { DataZoneMSKProducerAuthorizerProps } from "./datazone-msk-producer-authorizer-props";
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { DataZoneAuthorizer } from "../datazone-authorizer";

export class DataZoneMSKProducerAuthorizer extends TrackedConstruct {
    readonly mskProducerAuthorizerHandler: Function

    constructor(scope: Construct, id: string, props: DataZoneMSKProducerAuthorizerProps) {
        const trackedConstructProps: TrackedConstructProps = {
            trackingTag: DataZoneMSKProducerAuthorizer.name,
        };

        super(scope, id, trackedConstructProps);

        const mskProducerAuthorizerHandlerRole = new Role(this, "MSKProducerAuthorizerHandlerRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ],
            inlinePolicies: {
                "MSKPermissions": new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: [
                                "kafka:UpdateConnectivity",
                                "kafka:PutClusterPolicy"
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        })

        this.mskProducerAuthorizerHandler = new Function(this, "MSKProducerAuthorizerHandler", {
            runtime: Runtime.NODEJS_LATEST,
            handler: "index.handler",
            code: Code.fromAsset(__dirname+"/../resources/msk-producer-authorizer/"),
            role: mskProducerAuthorizerHandlerRole,
            timeout: Duration.seconds(5)
        })

        new Rule(this, "MSKProducerEBRule", {
            eventBus: props.producerAuthorizerEventBus,
            eventPattern: {
                source: [DataZoneAuthorizer.EVENT_SOURCE],
                detailType: [DataZoneAuthorizer.DT_MSK_PRODUCER_AUTHORIZATION]
            },
            targets: [
                new LambdaFunction(this.mskProducerAuthorizerHandler)
            ]
        })
    }
}