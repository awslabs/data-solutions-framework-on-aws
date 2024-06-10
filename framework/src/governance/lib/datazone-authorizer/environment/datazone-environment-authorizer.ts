import { Construct } from "constructs";
import { TrackedConstruct, TrackedConstructProps } from "../../../../utils";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { AccountPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";
import { DataZoneEnvironmentAuthorizerProps } from "./datazone-environment-authorizer-props";
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { DataZoneAuthorizer } from "../datazone-authorizer";

export class DataZoneEnvironmentAuthorizer extends TrackedConstruct {
    readonly authorizerEnvironmentEventBus: EventBus

    constructor(scope: Construct, id: string, props: DataZoneEnvironmentAuthorizerProps) {
        const trackedConstructProps: TrackedConstructProps = {
            trackingTag: DataZoneEnvironmentAuthorizer.name,
        };

        super(scope, id, trackedConstructProps);
        const stack = Stack.of(this)
        this.authorizerEnvironmentEventBus = new EventBus(this, "AuthorizerEnvironmentEventBus", {
            eventBusName: `datazone-authorizer-${stack.account}-environment`
        })
        
        this.authorizerEnvironmentEventBus.grantPutEventsTo(new AccountPrincipal(props.centralAccountId))

        const targetCentralEventBusArn = `arn:aws:events:${Stack.of(this).region}:${props.centralAccountId}:event-bus/datazone-authorizer-${props.centralAccountId}-workflow`

        const forwardToCentralRole = new Role(this, `DZGovernance-${props.centralAccountId}-CrossAccRole`, {
            assumedBy: new ServicePrincipal("events.amazonaws.com"),
            inlinePolicies: {
                "EventBridgePermission": new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: [
                                "events:PutEvents"
                            ],
                            resources: [
                                targetCentralEventBusArn
                            ]
                        })
                    ]
                })
            }
        })

        new Rule(this, `DZGovernance-${props.centralAccountId}-Rule`, {
            eventBus: this.authorizerEnvironmentEventBus,
            eventPattern: {
                source: [DataZoneAuthorizer.EVENT_SOURCE],
                detailType: [DataZoneAuthorizer.DT_DZ_GOVERNANCE],
            },
            targets: [
                new targets.EventBus(EventBus.fromEventBusArn(this, `TargetCentral-${props.centralAccountId}-EventBus`, targetCentralEventBusArn), {role: forwardToCentralRole})
            ]
        })
    }
}