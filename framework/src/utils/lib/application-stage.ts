// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ApplicationStackFactory } from './application-stack-factory';
import { IntegrationTestStack } from './integration-test-stack';


/**
 * The list of CICD Stages used in CICD Pipelines.
 */
export class CICDStage {

  /**
   * Prod stage
   */
  public static readonly PROD = CICDStage.of('PROD');

  /**
   * Staging stage
   */
  public static readonly STAGING = CICDStage.of('STAGING');

  /**
   * Custom stage
   * @param stage the stage inside the pipeline
   * @returns
   */
  public static of(stage: string) {
    return new CICDStage(stage);
  }

  /**
   * @param stage the stage inside the pipeline
   */
  private constructor(public readonly stage: string) {}
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

  /**
   * Whether to attach the integration test with this stage or not.
   * @default - No integration test is attached with this stage
   */
  readonly attachIntegrationTest?: boolean;

  /**
   * (Optional) These are parameters that are passed down to the integration test stack.
   * For example: the integration test script and where the test script is located.
   */
  readonly stageProps?: Record<string, any>;
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
   * The created integration test stack
   */
  public readonly integrationTestStack?: IntegrationTestStack;

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

    //handle integration test
    if (props.attachIntegrationTest) {
      this.integrationTestStack = this.createIntegrationTestStack(props);
      this.integrationTestStack.addDependency(applicationStack);
    }
  }

  private createIntegrationTestStack(props: ApplicationStageProps) {
    const stackProps = props.stageProps;
    if (stackProps !== null && stackProps !== undefined) {
      if (stackProps.integTestScript !== null && stackProps.integTestScript !== undefined
        && stackProps.integTestCommand !== null && stackProps.integTestCommand !== undefined) {
        const integTestCommand = stackProps.integTestCommand;
        const integScriptPath = stackProps.integScriptPath;
        const integTestPermissions = stackProps.integTestPermissions ? stackProps.integTestPermissions as PolicyStatement[] : undefined;

        return new IntegrationTestStack(this
          , 'IntegrationTestStack'
          , props.stage
          , integScriptPath
          , integTestCommand
          , this.stackOutputsEnv
          , integTestPermissions);
      }
    }

    throw new Error('Missing integration test specific parameters');
  }
}
