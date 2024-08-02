import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRule } from 'aws-cdk-lib/aws-events';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { DataZoneMskCentralAuthorizerProps } from './datazone-msk-central-authorizer-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { authorizerCentralWorkflowSetup } from '../custom-authorizer-central-helpers';


export class DataZoneMskCentralAuthorizer extends TrackedConstruct {
  private static AUTHORIZER_NAME = 'dsf.MskTopicAuthorizer';
  private static MSK_ASSET_TYPE = 'MskTopicAssetType';
  public readonly metadataCollectorRole: IRole;
  public readonly metadataCollectorFunction: IFunction;
  public readonly datazoneCallbackRole: IRole;
  public readonly datazoneCallbackFunction: IFunction;
  public readonly deadLetterQueue: IQueue;
  public readonly eventRole : IRole;
  public readonly eventRule: IRule;
  public readonly stateMachine: IStateMachine;

  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneMskCentralAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskCentralAuthorizer.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    this.metadataCollectorRole = new Role(this, 'MetadataCollectorHandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DataZonePermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'datazone:GetAsset',
                'datazone:GetEnvironment',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.metadataCollectorFunction = new Function(this, 'MetadataCollectorHandler', {
      runtime: Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname + '/resources/datazone-msk-authorizer-metadata-collector/'),
      role: this.metadataCollectorRole,
      timeout: Duration.seconds(30),
    });

    this.datazoneCallbackRole = new Role(this, 'CallbackHandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DataZonePermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'datazone:UpdateSubscriptionGrantStatus',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.datazoneCallbackFunction = new Function(this, 'CallbackHandler', {
      runtime: Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname+'/resources/datazone-msk-authorizer-callback/'),
      role: this.metadataCollectorRole,
      timeout: Duration.seconds(30),
    });

    const datazonePattern = {
      'source': ['aws.datazone'],
      'detail-type': ['Subscription Grant Requested'],
      'detail': {
        metadata: {
          domain: [props.domainId],
        },
        data: {
          asset: {
            typeName: [DataZoneMskCentralAuthorizer.MSK_ASSET_TYPE],
          },
        },
      },
    };

    const customAuthorizer = authorizerCentralWorkflowSetup(this,
      'DataZoneMskCentralWorkflow',
      DataZoneMskCentralAuthorizer.AUTHORIZER_NAME,
      this.metadataCollectorFunction,
      this.datazoneCallbackFunction,
      datazonePattern,
      Duration.minutes(5),
      0,
      this.removalPolicy,
    );

    this.deadLetterQueue = customAuthorizer.deadLetterQueue;
    this.eventRole = customAuthorizer.eventRole;
    this.eventRule = customAuthorizer.eventRule;
    this.stateMachine = customAuthorizer.stateMachine;
  }
}