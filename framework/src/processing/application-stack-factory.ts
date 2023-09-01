// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
* Abstract class that needs to be implemented to pass the application Stack to the CICD pipeline.
*/
export abstract class ApplicationStackFactory {

  /**
   * Abstract method that needs to be implemented to return the application Stack.
   * @param scope The scope to create the stack in.
   */
  abstract createStack(scope: Construct): Stack;
}