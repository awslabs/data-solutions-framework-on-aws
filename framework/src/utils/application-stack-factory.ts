// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CICDStage } from './application-stage';

/**
 * Abstract class that needs to be implemented to pass the application Stack to the CICD pipeline.
 *
 * @exampleMetadata fixture=imports-only
 * @example
 * interface MyApplicationStackProps extends cdk.StackProps {
 *   readonly stage: dsf.CICDStage;
 * }
 *
 * class MyApplicationStack extends cdk.Stack {
 *   constructor(scope: Construct, id: string, props?: MyApplicationStackProps) {
 *     super(scope, id, props);
 *     // stack logic goes here... and can be customized using props.stage
 *   }
 * }
 *
 * class MyApplicationStackFactory extends dsf.ApplicationStackFactory {
 *   createStack(scope: Construct, stage: dsf.CICDStage): cdk.Stack {
 *     return new MyApplicationStack(scope, 'MyApplication', {
 *       stage: stage
 *     } as MyApplicationStackProps);
 *   }
 * }
 */
export abstract class ApplicationStackFactory {

  /**
   * Abstract method that needs to be implemented to return the application Stack.
   * @param scope The scope to create the stack in.
   * @param stage The stage of the pipeline.
   */
  abstract createStack(scope: Construct, stage: CICDStage): Stack;
}
