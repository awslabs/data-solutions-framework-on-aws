// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IRule } from 'aws-cdk-lib/aws-events';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { DataZoneMskCentralAuthorizerProps } from './datazone-msk-central-authorizer-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { authorizerCentralWorkflowSetup, registerAccount } from '../custom-authorizer-central-helpers';


/**
 * A central authorizer workflow for granting read access to Kafka topics.
 * The workflow is triggered by an event sent to the DataZone event bus.
 * First, it collects metadata from DataZone about the Kafka topics.
 * Then, it grants access to the relevant IAM roles.
 * Finally acknowledge the subscription grant in DataZone.
 *
 * @example
 * new dsf.governance.DataZoneMskCentralAuthorizer(this, 'MskAuthorizer', {
 *   domainId: 'aba_dc999t9ime9sss',
 * });
 */
export class DataZoneMskCentralAuthorizer extends TrackedConstruct {
  /**
   * The name of the authorizer
   */
  public static readonly AUTHORIZER_NAME = 'MskTopicAuthorizer';
  /**
   * The asset type for the DataZone custom asset type
   */
  public static readonly MSK_ASSET_TYPE = 'MskTopicAssetType';
  /**
   * The role used to collect metadata from DataZone
   */
  public readonly metadataCollectorRole: IRole;
  /**
   * The Lambda function used to collect metadata from DataZone
   */
  public readonly metadataCollectorFunction: IFunction;
  /**
   * The role used to acknowledge the subscription grant in DataZone
   */
  public readonly datazoneCallbackRole: IRole;
  /**
   * The Lambda function used to acknowledge the subscription grant in DataZone
   */
  public readonly datazoneCallbackFunction: IFunction;
  /**
   * The dead letter queue for the authorizer workflow
   */
  public readonly deadLetterQueue: IQueue;
  /**
   * The role used by the DataZone event to trigger the authorizer workflow
   */
  public readonly datazoneEventRole : IRole;
  /**
   * The event rule used to trigger the authorizer workflow
   */
  public readonly datazoneEventRule: IRule;
  /**
   * The state machine used to orchestrate the authorizer workflow
   */
  public readonly stateMachine: StateMachine;
  /**
   * The IAM Role used by the authorizer workflow State Machine
   */
  public readonly stateMachineRole: Role;
  /**
   * The IAM Role used by the authorizer workflow callback
   */
  public readonly stateMachineCallbackRole: Role;

  private readonly removalPolicy: RemovalPolicy;

  /**
   * Construct an instance of the DataZoneMskCentralAuthorizer
   * @param scope the Scope of the CDK Construct
   * @param id the ID of the CDK Construct
   * @param props The DataZoneMskCentralAuthorizer properties
   */
  constructor(scope: Construct, id: string, props: DataZoneMskCentralAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskCentralAuthorizer.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);

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
                'datazone:GetListing',
                'datazone:GetEnvironment',
                'datazone:GetSubscriptionTarget',
                'datazone:UpdateSubscriptionGrantStatus',
              ],
              resources: [`arn:${stack.partition}:datazone:${stack.region}:${stack.account}:domain/${props.domainId}`],
            }),
          ],
        }),
      },
    });

    this.metadataCollectorFunction = new Function(this, 'MetadataCollectorHandler', {
      runtime: Runtime.NODEJS_20_X,
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
              resources: [`arn:${stack.partition}:datazone:${stack.region}:${stack.account}:domain/${props.domainId}`],
            }),
          ],
        }),
      },
    });

    this.datazoneCallbackFunction = new Function(this, 'CallbackHandler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(__dirname+'/resources/datazone-msk-authorizer-callback/'),
      role: this.datazoneCallbackRole,
      timeout: Duration.seconds(30),
    });

    const datazonePattern = {
      'source': ['aws.datazone'],
      'detail-type': [
        'Subscription Grant Requested',
        'Subscription Grant Revoke Requested',
      ],
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
      DataZoneMskCentralAuthorizer.AUTHORIZER_NAME,
      this.metadataCollectorFunction,
      this.datazoneCallbackFunction,
      datazonePattern,
      Duration.minutes(5),
      0,
      this.removalPolicy,
    );

    this.deadLetterQueue = customAuthorizer.deadLetterQueue;
    this.datazoneEventRole = customAuthorizer.authorizerEventRole;
    this.datazoneEventRule = customAuthorizer.authorizerEventRule;
    this.stateMachine = customAuthorizer.stateMachine;
    this.stateMachineRole = customAuthorizer.stateMachineRole;
    this.stateMachineCallbackRole = customAuthorizer.callbackRole;
  }


  /**
   * Connect the central authorizer workflow with environment authorizer workflows in other accounts.
   * This method grants the environment workflow to send events in the default Event Bridge bus for orchestration.
   * @param id The construct ID to use
   * @param accountId The account ID to register the authorizer with
   * @returns The CfnEventBusPolicy created to grant the account
   */
  public registerAccount(id: string, accountId: string) {
    registerAccount(this, id, accountId, DataZoneMskCentralAuthorizer.AUTHORIZER_NAME, this.stateMachineRole, this.stateMachineCallbackRole);
  };
}