import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { CfnEventBusPolicy, IRule } from 'aws-cdk-lib/aws-events';
import { IRole, Role, ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { DataZoneMskCentralAuthorizer } from './datazone-msk-central-authorizer';
import { DataZoneMskEnvironmentAuthorizerProps } from './datazone-msk-environment-authorizer-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { authorizerEnvironmentWorkflowSetup } from '../custom-authorizer-environment-helpers';


export class DataZoneMskEnvironmentAuthorizer extends TrackedConstruct {

  public readonly grantRole: IRole;
  public readonly grantFunction: IFunction;
  public readonly eventBusPolicy?: CfnEventBusPolicy;
  public readonly deadLetterQueue: any;
  public readonly eventRole: IRole;
  public readonly eventRule: IRule;
  public readonly stateMachine: IStateMachine;
  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneMskEnvironmentAuthorizerProps) {
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
                'iam:DeleteRolePolicy',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kafka:GetClusterPolicy',
                'kafka:PutClusterPolicy',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.grantFunction = new Function(this, 'GrantFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname + '/resources/datazone-msk-authorizer-grant/'),
      role: this.grantRole,
      timeout: Duration.seconds(30),
    });

    const customAuthorizer = authorizerEnvironmentWorkflowSetup(this,
      'DataZoneMskEnvironmentWorkflow',
      DataZoneMskCentralAuthorizer.AUTHORIZER_NAME,
      this.grantFunction,
      props.centralAccountId,
      Duration.minutes(2),
      0,
      this.removalPolicy,
    );

    this.eventBusPolicy = customAuthorizer.eventBusPolicy;
    this.deadLetterQueue = customAuthorizer.deadLetterQueue;
    this.eventRole = customAuthorizer.eventRole;
    this.eventRule = customAuthorizer.eventRule;
    this.stateMachine = customAuthorizer.stateMachine;

  }
}