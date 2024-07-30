import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { AccountPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DataZoneEnvironmentAuthorizerProps } from './datazone-environment-authorizer-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../../utils';
import { DataZoneAuthorizer } from '../datazone-authorizer';

export class DataZoneEnvironmentAuthorizer extends TrackedConstruct {
  readonly authorizerEnvironmentEventBus: EventBus;

  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneEnvironmentAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneEnvironmentAuthorizer.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const stack = Stack.of(this);
    this.authorizerEnvironmentEventBus = new EventBus(this, 'AuthorizerEnvironmentEventBus', {
      eventBusName: `datazone-authorizer-${stack.account}-environment`,
    });

    this.authorizerEnvironmentEventBus.applyRemovalPolicy(this.removalPolicy);

    this.authorizerEnvironmentEventBus.grantPutEventsTo(new AccountPrincipal(props.centralAccountId));

    const targetCentralEventBusArn = `arn:aws:events:${Stack.of(this).region}:${props.centralAccountId}:event-bus/datazone-authorizer-${props.centralAccountId}-workflow`;

    const forwardToCentralRole = new Role(this, `DZGovernance-${props.centralAccountId}-CrossAccRole`, {
      assumedBy: new ServicePrincipal('events.amazonaws.com'),
      inlinePolicies: {
        EventBridgePermission: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'events:PutEvents',
              ],
              resources: [
                targetCentralEventBusArn,
              ],
            }),
          ],
        }),
      },
    });

    forwardToCentralRole.applyRemovalPolicy(this.removalPolicy);

    const forwardToCentralRule = new Rule(this, `DZGovernance-${props.centralAccountId}-Rule`, {
      eventBus: this.authorizerEnvironmentEventBus,
      eventPattern: {
        source: [DataZoneAuthorizer.EVENT_SOURCE],
        detailType: [DataZoneAuthorizer.DT_DZ_GOVERNANCE],
      },
      targets: [
        new targets.EventBus(EventBus.fromEventBusArn(this, `TargetCentral-${props.centralAccountId}-EventBus`, targetCentralEventBusArn), { role: forwardToCentralRole }),
      ],
    });

    forwardToCentralRule.applyRemovalPolicy(this.removalPolicy);
  }
}