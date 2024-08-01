// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { ApplicationStackFactory } from '../../../utils';
import { SparkImage } from '../emr-releases';
import { CodePipelineSource } from 'aws-cdk-lib/pipelines';

/**
 * Properties for the `SparkEmrCICDPipeline` construct.
 */
export interface SparkEmrCICDPipelineProps {
  /**
   * The name of the Spark application to be deployed.
   */
  readonly sparkApplicationName: string;

  /**
   * The application CDK Stack to deploy in the different CDK Pipelines Stages
   */
  readonly applicationStackFactory: ApplicationStackFactory;

  /**
   * The path to the folder that contains the CDK Application
   * @default - The root of the repository
   */
  readonly cdkApplicationPath?: string;

  /**
   * The path to the folder that contains the Spark Application
   * @default - The root of the repository
   */
  readonly sparkApplicationPath?: string;

  /**
   * The EMR Spark image to use to run the unit tests
   * @default - [DEFAULT_SPARK_IMAGE](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/emr-releases.ts#L51)
   */
  readonly sparkImage?: SparkImage;

  /**
   * The path to the Shell script that contains integration tests
   * @default - No integration tests are run
   */
  readonly integTestScript?: string;

  /**
   * The environment variables to create from the Application CDK Stack outputs and to pass to the integration tests.
   * This is used to interact with resources created by the Application CDK Stack from within the integration tests script.
   * Key is the name of the environment variable to create. Value is generally a CfnOutput name from the Application CDK Stack.
   * @default - No environment variables
   */
  readonly integTestEnv?: Record<string, string>;

  /**
   * The IAM Policy statements to add permissions for running the integration tests.
   * @default - No permissions
   */
  readonly integTestPermissions?: PolicyStatement[];

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The connection to allow code pipeline to connect to your code repository
   * You can learn more about connections in this [link](https://docs.aws.amazon.com/dtconsole/latest/userguide/welcome-connections.html)
   */
  readonly source: CodePipelineSource;
}