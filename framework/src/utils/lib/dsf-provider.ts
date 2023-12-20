// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Context } from './context';
import { attachPolicyToRole, createLambdaExecutionRole, createLogGroup } from './dsf-provider-helpers';
import { DsfProviderProps } from './dsf-provider-props';

/**
 * @internal
 */
export class DsfProvider extends Construct {

  private static readonly CR_RUNTIME = Runtime.NODEJS_20_X;
  private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;

  public readonly serviceToken: string;

  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    let onEventHandlerLog: LogGroup = createLogGroup (scope, `OnEventHandlerLog`, removalPolicy, DsfProvider.LOG_RETENTION);
    let onEventHandlerRole: Role;


    if (props.onEventHandlerDefinition.IamRole) {
      onEventHandlerRole = props.onEventHandlerDefinition.IamRole;
    } else {
      onEventHandlerRole = createLambdaExecutionRole (scope, `OnEventHandlerRole`);
    }

    attachPolicyToRole(
      scope,
      'attachPolicyToRoleisCompleteHandler',
      onEventHandlerRole,
      onEventHandlerLog,
      props.onEventHandlerDefinition.crPolicy,
      props.onEventHandlerDefinition.crManagedPolicy);

    let onEventHandlerLambdaFunction: NodejsFunction = new NodejsFunction (scope, 'onEventHandlerLambdaFunction', {
      runtime: DsfProvider.CR_RUNTIME,
      handler: props.onEventHandlerDefinition.handler,
      entry: props.onEventHandlerDefinition.entryFile,
      depsLockFilePath: props.onEventHandlerDefinition.depsLockFilePath,
      logGroup: onEventHandlerLog,
      role: onEventHandlerRole,
      vpc: props.vpc,
      vpcSubnets: props.subnets,
      bundling: props.onEventHandlerDefinition.bundling,
    });


    let isCompleteHandlerLambdaFunction = undefined;

    if (props.isCompleteHandlerDefinition) {
      const isCompleteHandlerLog: LogGroup = createLogGroup (scope, 'isCompleteHandlerLog', removalPolicy, DsfProvider.LOG_RETENTION);
      let isCompleteHandlerRole: Role;

      if (props.isCompleteHandlerDefinition.IamRole) {
        isCompleteHandlerRole = props.isCompleteHandlerDefinition.IamRole;
      } else {
        isCompleteHandlerRole = createLambdaExecutionRole (scope, 'isCompleteHandlerRole');
      }

      attachPolicyToRole(
        scope,
        'attachPolicyToRoleisCompleteHandler',
        isCompleteHandlerRole,
        isCompleteHandlerLog,
        props.isCompleteHandlerDefinition.crPolicy,
        props.isCompleteHandlerDefinition.crManagedPolicy);

      isCompleteHandlerLambdaFunction = new NodejsFunction (scope, 'isCompleteHandlerLambdaFunction', {
        runtime: DsfProvider.CR_RUNTIME,
        handler: props.isCompleteHandlerDefinition.handler,
        entry: props.isCompleteHandlerDefinition.entryFile,
        depsLockFilePath: props.isCompleteHandlerDefinition.depsLockFilePath,
        logGroup: isCompleteHandlerLog,
        role: isCompleteHandlerRole,
        vpc: props.vpc,
        vpcSubnets: props.subnets,
        bundling: props.isCompleteHandlerDefinition.bundling,
      });
    }

    let customeResourceProvider = new Provider (scope, 'customeResourceProvider', {
      onEventHandler: onEventHandlerLambdaFunction,
      isCompleteHandler: isCompleteHandlerLambdaFunction,
      queryInterval: props.queryInterval,
      totalTimeout: props.queryTimeout,
    });

    this.serviceToken = customeResourceProvider.serviceToken;

  }

}