// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps } from 'aws-cdk-lib';
import { CICDStage } from './application-stage';
import { Construct } from 'constructs';

/**
 * Properties for the ApplicationStack class.
 */
export interface ApplicationStackProps extends StackProps {
  
  /**
   * The stage of the CICD pipeline used to change the behavior of the stack
   * @default - No stage is used and the stack is not adapted to the stage
   */
  readonly stage?: CICDStage;
}

/**
 * The ApplicationStack class that extends a CDK stack with the stage of a CICD pipeline parameter to adapt the behavior.
 */
export class ApplicationStack extends Stack {
  /**
   * Construct a new instance of the ApplicationStack class.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {ApplicationStackProps} props the ApplicationStackProps properties
   */
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
  }
}