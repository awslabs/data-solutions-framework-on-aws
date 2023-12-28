// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Effect, IRole, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Context } from './context';
import { DsfProviderProps } from './dsf-provider-props';

/**
 * @internal
 */
export class DsfProvider extends Construct {

  private static readonly CR_RUNTIME = Runtime.NODEJS_20_X;
  private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;

  public readonly serviceToken: string;
  public readonly onEventHandlerLog: ILogGroup;
  public readonly onEventHandlerRole: IRole;
  public readonly onEventHandlerFunction: IFunction;
  public readonly isCompleteHandlerLog?: ILogGroup;
  public readonly isCompleteHandlerRole?: IRole;
  public readonly isCompleteHandlerFunction?: IFunction;
  private readonly removalPolicy: RemovalPolicy;


  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.onEventHandlerRole = props.onEventHandlerDefinition.iamRole || this.createLambdaExecutionRole ('OnEventHandlerRole');
    this.onEventHandlerRole.addManagedPolicy(props.onEventHandlerDefinition.managedPolicy);

    this.onEventHandlerLog = this.createLogGroup('OnEventHandlerLog', this.onEventHandlerRole);

    this.onEventHandlerFunction = new NodejsFunction (scope, 'OnEventHandlerFunction', {
      runtime: DsfProvider.CR_RUNTIME,
      handler: props.onEventHandlerDefinition.handler,
      entry: props.onEventHandlerDefinition.entryFile,
      depsLockFilePath: props.onEventHandlerDefinition.depsLockFilePath,
      logGroup: this.onEventHandlerLog,
      role: this.onEventHandlerRole,
      bundling: props.onEventHandlerDefinition.bundling,
      environment: props.onEventHandlerDefinition.environment,
    });

    if (props.isCompleteHandlerDefinition) {
      this.isCompleteHandlerRole = props.isCompleteHandlerDefinition.iamRole || this.createLambdaExecutionRole ('IsCompleteHandlerRole');
      this.isCompleteHandlerRole.addManagedPolicy(props.isCompleteHandlerDefinition.managedPolicy);

      this.isCompleteHandlerLog = this.createLogGroup ('IsCompleteHandlerLog', this.isCompleteHandlerRole);

      this.isCompleteHandlerFunction = new NodejsFunction (scope, 'IsCompleteHandlerLambdaFunction', {
        runtime: DsfProvider.CR_RUNTIME,
        handler: props.isCompleteHandlerDefinition.handler,
        entry: props.isCompleteHandlerDefinition.entryFile,
        depsLockFilePath: props.isCompleteHandlerDefinition.depsLockFilePath,
        logGroup: this.isCompleteHandlerLog,
        role: this.isCompleteHandlerRole,
        bundling: props.isCompleteHandlerDefinition.bundling,
        environment: props.isCompleteHandlerDefinition.environment,
      });
    }

    const customResourceProvider = new Provider (scope, 'CustomResourceProvider', {
      onEventHandler: this.onEventHandlerFunction,
      isCompleteHandler: this.isCompleteHandlerFunction,
      queryInterval: props.queryInterval,
      vpc: props.vpc,
      vpcSubnets: props.subnets,
      securityGroups: props.securityGroups,
      totalTimeout: props.queryTimeout,
      logRetention: DsfProvider.LOG_RETENTION,
    });

    this.serviceToken = customResourceProvider.serviceToken;

  }

  private createLambdaExecutionRole(id: string): Role {

    return new Role (this, id, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
  }

  private createLogGroup(id: string, role: IRole) : ILogGroup {

    const logGroup: LogGroup = new LogGroup (this, `${id}LogGroup`, {
      retention: DsfProvider.LOG_RETENTION,
      removalPolicy: this.removalPolicy,
    });

    const createLogStreamPolicy = new PolicyStatement({
      actions: ['logs:CreateLogStream'],
      resources: [`${logGroup.logGroupArn}`],
      effect: Effect.ALLOW,
    });

    const putLogEventsPolicy = new PolicyStatement({
      actions: ['logs:PutLogEvents'],
      resources: [`${logGroup.logGroupArn}:log-stream:*`],
      effect: Effect.ALLOW,
    });

    const basicExecutionRolePolicy = new Policy(this, `${id}Policy`, {
      statements: [createLogStreamPolicy, putLogEventsPolicy],
    });

    role.attachInlinePolicy(basicExecutionRolePolicy);

    return logGroup;
  }
}