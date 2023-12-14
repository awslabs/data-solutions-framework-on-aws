// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { DsfProviderProps } from './dsf-provider-props';
import { Context } from './context';
import { createLambdaExecutionRole, createLogGroup } from '../dsf-provider-helpers';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'; 

/**
 * @internal
 */
export class DsfProvider extends Construct
 {

  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    const onEventHandlerLog: LogGroup = createLogGroup (scope, `${props.providerName}OnEventHandlerLog`, removalPolicy); 
    const onEventHandlerRole: Role = createLambdaExecutionRole (scope, `${props.providerName}OnEventHandlerRole`);


    let onEventHandlerLambdaFunction: Function = new Function (scope, `${props.providerName}Function`, {
        runtime: Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: Code.fromAsset(''),
        logGroup: onEventHandlerLog,

      });
  }

}