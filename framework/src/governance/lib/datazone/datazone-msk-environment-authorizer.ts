import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRule } from 'aws-cdk-lib/aws-events';
import { IRole, Role, ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { authorizerEnvironmentWorkflowSetup } from '../custom-authorizer-environment-helpers';
import { DataZoneMskCentralAuthorizerProps } from './datazone-msk-central-authorizer-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';


export class DataZoneMskEnvironmentAuthorizer extends TrackedConstruct {

  public readonly grantRole: IRole;
  public readonly grantFunction: IFunction;
  public readonly callbackFunction: IFunction;
  public readonly callbackRole: IRole;
  public readonly deadLetterQueue: any;
  public readonly eventRole: IRole;
  public readonly eventRule: IRule;
  public readonly stateMachine: IStateMachine;
  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneMskCentralAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskEnvironmentAuthorizer.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    this.grantRole = new Role(this, 'GrantRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        IamPermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'iam:PutRolePolicy',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.grantFunction = new Function(this, 'GrantFunction', {
      runtime: Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname + '/resources/datazone-msk-authorizer-grant/'),
      role: this.grantRole,
      timeout: Duration.seconds(30),
    });

    const customAuthorizer = authorizerEnvironmentWorkflowSetup(this,
      'DataZoneMskEnvironmentWorkflow',
      'mskTopicIam',
      this.grantFunction,
      Duration.minutes(2),
      0,
      this.removalPolicy,
    );

    this.callbackFunction = customAuthorizer.callbackFunction;
    this.callbackRole = customAuthorizer.callbackRole;
    this.deadLetterQueue = customAuthorizer.deadLetterQueue;
    this.eventRole = customAuthorizer.eventRole;
    this.eventRule = customAuthorizer.eventRule;
    this.stateMachine = customAuthorizer.stateMachine;

  }
}