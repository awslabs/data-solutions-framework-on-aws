// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStackFactory } from './application-stack-factory';


/**
 * The list of CICD Stages used in CICD Pipelines.
 */
export enum CICDStage {
  STAGING = 'staging',
  PROD = 'prod',
}

/**
 * Properties for the `ApplicationStage` class.
 */
export interface ApplicationStageProps extends StageProps {
  /**
   * The application CDK Stack Factory used to create application Stacks
   */
  readonly applicationStackFactory: ApplicationStackFactory;

  /**
   * The list of values to create CfnOutputs
   * @default - No CfnOutputs are created
   */
  readonly outputsEnv?: Record<string, string>;

  /**
   * The Stage to deploy the application CDK Stack in
   * @default - No stage is passed to the application stack
   */
  readonly stage: CICDStage;
}

/**
 * ApplicationStage class that creates a CDK Pipelines Stage from an ApplicationStackFactory.
 *
 */
export class ApplicationStage extends Stage {

  /**
   * The list of CfnOutputs created by the CDK Stack
   */
  public readonly stackOutputsEnv?: Record<string, CfnOutput>;

  /**
   * Construct a new instance of the SparkCICDStage class.
   * @param scope the Scope of the CDK Construct
   * @param id the ID of the CDK Construct
   * @param props the ApplicationStage properties
   */
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    // create the CDK Stack from the ApplicationStackFactory using the proper scope
    const applicationStack = props.applicationStackFactory.createStack(this, props.stage);

    // create CfnOutputs from the variables to expose in env variables for integration tests
    if (props.outputsEnv) {
      this.stackOutputsEnv = {};
      for (let key in props.outputsEnv) {
        const outputName = props.outputsEnv[key];
        this.stackOutputsEnv[key] = applicationStack.node.children.find(v => (v as CfnOutput)?.logicalId?.includes(outputName)) as CfnOutput;;
      }
    }
  }
}
