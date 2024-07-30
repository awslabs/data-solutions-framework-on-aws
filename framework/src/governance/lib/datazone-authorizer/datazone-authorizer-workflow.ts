import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { AccountPrincipal, Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DataZoneAuthorizer } from './datazone-authorizer';
import { DataZoneAuthorizerWorkflowProps } from './datazone-authorizer-workflow-props';
import { SubscriptionAssetTypeHandler } from './subscription-asset-type-handler';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

export class DataZoneAuthorizerWorkflow extends TrackedConstruct {

  readonly authorizerEventBus: EventBus;
  readonly metadataCollectorHandler: Function;

  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneAuthorizerWorkflowProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneAuthorizerWorkflow.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);
    this.authorizerEventBus = new EventBus(this, 'DataZoneAuthorizerEventBus', {
      eventBusName: `datazone-authorizer-${Stack.of(this).account}-workflow`,
    });

    this.authorizerEventBus.applyRemovalPolicy(this.removalPolicy);

    const metadataCollectorHandlerRole = new Role(this, 'MetadataCollectorHandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        EventBusPermission: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'events:PutEvents',
              ],
              resources: [this.authorizerEventBus.eventBusArn],
            }),
          ],
        }),
        DataZonePermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'datazone:ListEnvironments',
                'datazone:GetAsset',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    metadataCollectorHandlerRole.applyRemovalPolicy(this.removalPolicy);

    this.metadataCollectorHandler = new Function(this, 'MetadataCollectorHandler', {
      runtime: Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname+'/../resources/workflow-metadata-collector/'),
      role: metadataCollectorHandlerRole,
      timeout: Duration.seconds(5),
      environment: {
        AUTHORIZER_EVENT_BUS: this.authorizerEventBus.eventBusName,
      },
    });

    this.metadataCollectorHandler.applyRemovalPolicy(this.removalPolicy);
  }

  public registerSubscriptionAssetTypeAuthorizationHandler(assetType: string, subscriptionAssetTypeHandler: SubscriptionAssetTypeHandler) {
    const producerRule = new Rule(this, `Subscription-Producer-${assetType}-Handler`, {
      eventBus: this.authorizerEventBus,
      eventPattern: {
        source: [DataZoneAuthorizer.EVENT_SOURCE],
        detailType: [`Subscription ${assetType} Authorization`],
      },
      targets: [
        new targets.LambdaFunction(subscriptionAssetTypeHandler.producerHandler()),
      ],
    });

    producerRule.applyRemovalPolicy(this.removalPolicy);

    // const consumerRule = new Rule(this, `Subscription-Consumer-${assetType}-Handler`, {
    //     eventBus: this.authorizerEventBus,
    //     eventPattern: {
    //         source: [DataZoneAuthorizer.EVENT_SOURCE],
    //         detailType: [`Subscription ${assetType} Authorization`]
    //     },
    //     targets: [
    //         new targets.LambdaFunction(subscriptionAssetTypeHandler.consumerHandler())
    //     ]
    // })

    // consumerRule.applyRemovalPolicy(this.removalPolicy)
  }

  public addEnvironment(envAccountId: string) {
    const targetEventBusArn = `arn:aws:events:${Stack.of(this).region}:${envAccountId}:event-bus/datazone-authorizer-${envAccountId}-environment`;

    const role = new Role(this, `EB-${envAccountId}-CrossAccRole`, {
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
                targetEventBusArn,
              ],
            }),
          ],
        }),
      },
    });

    role.applyRemovalPolicy(this.removalPolicy);

    this.authorizerEventBus.grantPutEventsTo(new AccountPrincipal(envAccountId));

    const forwardRule = new Rule(this, `EB-Forward-${envAccountId}-Rule`, {
      eventBus: this.authorizerEventBus,
      eventPattern: {
        source: [DataZoneAuthorizer.EVENT_SOURCE],
        detail: {
          targetAccountId: [envAccountId],
        },
      },
      targets: [
        new targets.EventBus(EventBus.fromEventBusArn(this, `Target-${envAccountId}-EventBus`, targetEventBusArn), { role }),
      ],
    });

    forwardRule.applyRemovalPolicy(this.removalPolicy);
  }
}