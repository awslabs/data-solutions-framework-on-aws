// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStackFactory } from './application-stack-factory';


/**
 * The list of CICD Stages to deploy the SparkCICDStack.
 */
export enum CICDStage {
  STAGING = 'staging',
  PROD = 'prod',
}

/**
 * Properties for SparkCICDStage class.
 */
export interface ApplicationStageProps extends StageProps {
  /**
   * The application Stack to deploy in the different CDK Pipelines Stages
   */
  readonly applicationStackFactory: ApplicationStackFactory;

  /**
   * The list of values to create CfnOutputs
   * @default - No CfnOutputs are created
   */
  readonly outputsEnv?: Record<string, string>;

  /**
   * The Stage to deploy the SparkCICDStack in
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
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {SparkCICDStageProps} props the SparkCICDStageProps properties
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
