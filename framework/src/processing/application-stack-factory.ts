// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { CICDStage } from './application-stage';

/**
* Abstract class that needs to be implemented to pass the application Stack to the CICD pipeline.
*
* @example
* import { ApplicationStackFactory }
* import { CICDStage } from './application-stage';
*
* interface MyApplicationStackProps extends StackProps {
*   readonly stage: CICDStage;
* }
*
* class MyApplicationStack extends Stack {
*   constructor(scope: Stack, id: string, props?: MyApplicationStackProps) {
*     super(scope, id, props);
*     // stack logic goes here... and can be customized using props.stage
*   }
* }
*
* class MyApplicationStackFactory extends ApplicationStackFactory {
*   createStack(scope: Construct, stage: CICDStage): Stack {
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
