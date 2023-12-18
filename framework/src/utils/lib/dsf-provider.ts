// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { DsfProviderProps } from './dsf-provider-props';
import { Context } from './context';
import { createLambdaExecutionRole, createLogGroup } from './dsf-provider-helpers';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime} from 'aws-cdk-lib/aws-lambda'; 
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Provider } from 'aws-cdk-lib/custom-resources';

/**
 * @internal
 */
export class DsfProvider extends Construct {
  
  public readonly serviceToken: string;

  private static readonly CR_RUNTIME = Runtime.NODEJS_20_X;
  private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;

  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    const onEventHandlerLog: LogGroup = createLogGroup (scope, `${props.providerName}OnEventHandlerLog`, removalPolicy, DsfProvider.LOG_RETENTION); 
    const onEventHandlerRole: Role = createLambdaExecutionRole (scope, `${props.providerName}OnEventHandlerRole`);


    let onEventHandlerLambdaFunction: NodejsFunction = new NodejsFunction (scope, `${props.providerName}Function`, {
        runtime: DsfProvider.CR_RUNTIME,
        handler: props.onEventHandlerDefinition.handler,
        entry: props.onEventHandlerDefinition.entryFile,
        depsLockFilePath: props.onEventHandlerDefinition.depsLockFilePath,
        logGroup: onEventHandlerLog,
        role: onEventHandlerRole,
        vpc: props.vpc,
        vpcSubnets: props.subnets,
      });

    
    let isCompleteHandlerLambdaFunction = undefined;
    
    if (props.isCompleteHandlerDefinition) {
      const isCompleteHandlerLog: LogGroup = createLogGroup (scope, `${props.providerName}isCompleteHandler`, removalPolicy, DsfProvider.LOG_RETENTION); 
      const isCompleteHandlerRole: Role = createLambdaExecutionRole (scope, `${props.providerName}isCompleteHandler`);


      isCompleteHandlerLambdaFunction = new NodejsFunction (scope, `${props.providerName}Function`, {
          runtime: DsfProvider.CR_RUNTIME,
          handler: props.isCompleteHandlerDefinition.handler,
          entry: props.isCompleteHandlerDefinition.entryFile,
          depsLockFilePath: props.isCompleteHandlerDefinition.depsLockFilePath,
          logGroup: isCompleteHandlerLog,
          role: isCompleteHandlerRole,
          vpc: props.vpc,
          vpcSubnets: props.subnets,
        });
    }

    let customeResourceProvider = new Provider (scope, `${props.providerName}Provider`, {
      onEventHandler: onEventHandlerLambdaFunction,
      isCompleteHandler: isCompleteHandlerLambdaFunction,
      queryInterval: props.queryInterval,
      totalTimeout: props.queryTimeout
    });

    this.serviceToken = customeResourceProvider.serviceToken;

  }

}