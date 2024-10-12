// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRole, Role, ServicePrincipal, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { IFunction, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
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

  private static DEFAULT_LOGS_RETENTION = RetentionDays.ONE_WEEK;

  /**
   * The IAM role used to grant access to Kafka topics
   */
  public readonly grantRole: IRole;
  /**
   * The lambda function used to grant access to Kafka topics
   */
  public readonly grantFunction: IFunction;
  /**
   * The IAM role used by the environment authorizer State Machine
   */
  public readonly stateMachineRole: IRole;
  /**
   * The CloudWatch Log Group used by the Step Functions state machine
   */
  public readonly stateMachineLogGroup: ILogGroup;
  /**
   * The environment authorizer State Machine
   */
  public readonly stateMachine: IStateMachine;
  /**
   * The CloudWatch Log Group used by the grant function
   */
  public readonly grantLogGroup: LogGroup;

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

    this.grantLogGroup = new LogGroup(this, 'GrantLogGroup', {
      removalPolicy: this.removalPolicy,
      retention: props.logRetention || DataZoneMskEnvironmentAuthorizer.DEFAULT_LOGS_RETENTION,
    });

    const grantRole = props.grantRole || new Role(this, 'GrantRole', {
      roleName: `${DataZoneMskCentralAuthorizer.AUTHORIZER_NAME}GrantFunction`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
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
                'kafka:DeleteClusterPolicy',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.grantRole = grantRole;
    this.grantLogGroup.grantWrite(this.grantRole);

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
      props.stateMachineRole,
      props.centralAccountId,
      Duration.minutes(2),
      props.logRetention,
      this.removalPolicy,
    );

    this.stateMachine = customAuthorizer.stateMachine;
    this.stateMachineRole = customAuthorizer.stateMachineRole;
    this.stateMachineLogGroup = customAuthorizer.stateMachineLogGroup;

  }
}