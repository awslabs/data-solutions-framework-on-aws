// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
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
  private static readonly FUNCTION_TIMEOUT = Duration.minutes(14);

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

    // If there is a managed policy to attach we do it
    if (props.onEventHandlerDefinition.managedPolicy) {
      this.onEventHandlerRole.addManagedPolicy(props.onEventHandlerDefinition.managedPolicy);
    }
    // If the Lambda is deployed within a VPC, we attached required permissions
    if (props.vpc) {
      this.attachVpcPermissions(this.onEventHandlerRole, 'OnEventHandler');
    }
    // Create the CloudWatch Log Groups and atached required permissions for logging
    this.onEventHandlerLog = this.createLogGroup('OnEventHandler', this.onEventHandlerRole);

    this.onEventHandlerFunction = new NodejsFunction (scope, 'OnEventHandlerFunction', {
      runtime: DsfProvider.CR_RUNTIME,
      handler: props.onEventHandlerDefinition.handler,
      entry: props.onEventHandlerDefinition.entryFile,
      depsLockFilePath: props.onEventHandlerDefinition.depsLockFilePath,
      logGroup: this.onEventHandlerLog,
      role: this.onEventHandlerRole,
      bundling: props.onEventHandlerDefinition.bundling,
      environment: props.onEventHandlerDefinition.environment,
      timeout: props.onEventHandlerDefinition.timeout || DsfProvider.FUNCTION_TIMEOUT,
      vpc: props.vpc,
      vpcSubnets: props.subnets,
      securityGroups: props.securityGroups,
    });

    if (props.isCompleteHandlerDefinition) {
      this.isCompleteHandlerRole = props.isCompleteHandlerDefinition.iamRole || this.createLambdaExecutionRole ('IsCompleteHandlerRole');

      // If there is a managed policy to attach we do it
      if (props.isCompleteHandlerDefinition.managedPolicy) {
        this.isCompleteHandlerRole.addManagedPolicy(props.isCompleteHandlerDefinition.managedPolicy);
      }

      // If the Lambda is deployed within a VPC, we attached required permissions
      if (props.vpc) {
        this.attachVpcPermissions(this.isCompleteHandlerRole, 'IsCompleteHandler');
      }

      // Create the CloudWatch Log Groups and atached required permissions for logging
      this.isCompleteHandlerLog = this.createLogGroup ('IsCompleteHandler', this.isCompleteHandlerRole);

      this.isCompleteHandlerFunction = new NodejsFunction (scope, 'IsCompleteHandlerLambdaFunction', {
        runtime: DsfProvider.CR_RUNTIME,
        handler: props.isCompleteHandlerDefinition.handler,
        entry: props.isCompleteHandlerDefinition.entryFile,
        depsLockFilePath: props.isCompleteHandlerDefinition.depsLockFilePath,
        logGroup: this.isCompleteHandlerLog,
        role: this.isCompleteHandlerRole,
        bundling: props.isCompleteHandlerDefinition.bundling,
        environment: props.isCompleteHandlerDefinition.environment,
        timeout: props.onEventHandlerDefinition.timeout || DsfProvider.FUNCTION_TIMEOUT,
        vpc: props.vpc,
        vpcSubnets: props.subnets,
        securityGroups: props.securityGroups,
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

    const logStreamPolicy = new PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [`${logGroup.logGroupArn}:*`],
      effect: Effect.ALLOW,
    });

    const basicExecutionRolePolicy = new Policy(this, `${id}LogPolicy`, {
      statements: [logStreamPolicy],
    });

    role.attachInlinePolicy(basicExecutionRolePolicy);

    return logGroup;
  }

  private attachVpcPermissions(role: IRole, id: string) {
    const lambdaVpcPolicy = new Policy( this, `${id}VpcPolicy`, {
      statements: [
        new PolicyStatement({
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'ec2:AssignPrivateIpAddresses',
            'ec2:UnassignPrivateIpAddresses',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    });
    role.attachInlinePolicy(lambdaVpcPolicy);
  }
}