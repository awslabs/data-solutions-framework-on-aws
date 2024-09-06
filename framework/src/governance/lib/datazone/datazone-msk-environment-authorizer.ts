// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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

/**
 * An environment authorizer workflow for granting read access to Kafka topics.
 * The workflow is triggered by an event sent by the central authorizer construct.
 * It creates IAM policies required for the Kafka client to access the relevant topics.
 * It supports MSK provisioned and serverless, in single and cross accounts, and grant/revoke requests.
 *
 * @example
 * new dsf.governance.DataZoneMskEnvironmentAuthorizer(this, 'MskAuthorizer', {
 *   domainId: 'aba_dc999t9ime9sss',
 * });
 */
export class DataZoneMskEnvironmentAuthorizer extends TrackedConstruct {

  /**
   * The IAM role used to grant access to Kafka topics
   */
  public readonly grantRole: IRole;
  /**
   * The lambda function used to grant access to Kafka topics
   */
  public readonly grantFunction: IFunction;
  /**
   * The event bus policy used to receive events from the central authorizer
   */
  public readonly eventBusPolicy?: CfnEventBusPolicy;
  /**
   * The dead letter queue for the events
   */
  public readonly deadLetterQueue: any;
  /**
   * The role used by the events to trigger the authorizer workflow
   */
  public readonly eventRole: IRole;
  /**
   * The event rule used to trigger the authorizer workflow
   */
  public readonly eventRule: IRule;
  /**
   * The state machine used to orchestrate the authorizer workflow
   */
  public readonly stateMachine: IStateMachine;

  private readonly removalPolicy: RemovalPolicy;

  /**
   * Create an instance of the DataZoneMskEnvironmentAuthorizer construct
   * @param scope The CDK Construct scope
   * @param id The CDK Construct id
   * @param props The props for the DataZoneMskEnvironmentAuthorizer construct
   */
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
      timeout: Duration.seconds(60),
      environment: {
        GRANT_VPC: props.grantMskManagedVpc ? 'true' : 'false',
      },
    });

    const customAuthorizer = authorizerEnvironmentWorkflowSetup(this,
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