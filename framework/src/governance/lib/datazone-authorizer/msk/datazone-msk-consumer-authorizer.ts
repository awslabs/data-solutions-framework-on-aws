import { Construct } from "constructs";
import { TrackedConstruct, TrackedConstructProps } from "../../../../utils";
import { DataZoneMSKConsumerAuthorizerProps } from "./datazone-msk-consumer-authorizer-props";
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { DataZoneAuthorizer } from "../datazone-authorizer";

export class DataZoneMSKConsumerAuthorizer extends TrackedConstruct {
    readonly mskConsumerAuthorizerHandler: Function

    constructor(scope: Construct, id: string, props: DataZoneMSKConsumerAuthorizerProps) {
        const trackedConstructProps: TrackedConstructProps = {
            trackingTag: DataZoneMSKConsumerAuthorizer.name,
        };

        super(scope, id, trackedConstructProps);

        const mskConsumerAuthorizerHandlerRole = new Role(this, "MSKConsumerAuthorizerHandlerRole", {
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
                                "kafka:CreateVpcConnection"
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        })

        this.mskConsumerAuthorizerHandler = new Function(this, "MSKConsumerAuthorizerHandler", {
            runtime: Runtime.NODEJS_LATEST,
            handler: "index.handler",
            code: Code.fromAsset(__dirname+"/../resources/msk-consumer-authorizer/"),
            role: mskConsumerAuthorizerHandlerRole,
            timeout: Duration.seconds(5),
            environment: {
                VPC_ID: props.mskConnectionVPC.vpcId,
                SUBNET_IDS: props.mskConnectionVPC.selectSubnets(props.mskConnectionSubnetSelection).subnetIds.join(","),
                SECURITY_GROUP_IDS: props.mskConnectionSecurityGroups.map((sg) => sg.securityGroupId).join(",")
            }
        })

        new Rule(this, "MSKConsumerEBRule", {
            eventBus: props.consumerAuthorizerEventBus,
            eventPattern: {
                source: [DataZoneAuthorizer.EVENT_SOURCE],
                detailType: [DataZoneAuthorizer.DT_MSK_CONSUMER_AUTHORIZATION]
            },
            targets: [
                new LambdaFunction(this.mskConsumerAuthorizerHandler)
            ]
        })
    }
}