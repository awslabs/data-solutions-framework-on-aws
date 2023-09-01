// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApplicationStackFactory } from "./application-stack-factory";


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
  readonly outputs?: Record<string, string>;

  /**
   * The Stage to deploy the SparkCICDStack in
   */
  readonly stage: CICDStage;
}

/**
 * The SparkCICDStage class that create a CDK Pipelines Stage from a CDK Stack.
 *
 */
export class ApplicationStage extends Stage {

  /**
   * The list of CfnOutputs created by the CDK Stack
   */
  public readonly outputs?: Record<string, CfnOutput>;

  /**
   * Construct a new instance of the SparkCICDStage class.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {SparkCICDStageProps} props the SparkCICDStageProps properties
   */
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    // create the CDK Stack from the ApplicationStackFactory using the proper scope
    props.applicationStackFactory.createStack(this);

    // create CfnOutputs from the variables to expose in env variables for integration tests
    if (props?.outputs){
      this.outputs = {};
      for ( let key in props?.outputs){
        this.outputs[key] = new CfnOutput(this, key, {
          value: props?.outputs[key],
        })
      }
    }
  }
}