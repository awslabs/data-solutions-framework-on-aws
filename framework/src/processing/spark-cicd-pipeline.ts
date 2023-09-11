// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { ApplicationStackFactory } from './application-stack-factory';
import { CICDStage, ApplicationStage } from './application-stage';

const EMR_EKS_BASE_URL = 'public.ecr.aws/emr-on-eks/spark/';
const EMR_SERVERLESS_BASE_URL = 'public.ecr.aws/emr-serverless/spark/';

/**
 * The list of supported Spark images to use in the SparkCICDPipeline.
 */
export enum SparkImage {
  EMR_SERVERLESS_6_12 = EMR_SERVERLESS_BASE_URL + 'emr-6.12.0:latest',
  EMR_SERVERLESS_6_11 = EMR_SERVERLESS_BASE_URL + 'emr-6.11.0:latest',
  EMR_SERVERLESS_6_10 = EMR_SERVERLESS_BASE_URL + 'emr-6.10.0:latest',
  EMR_SERVERLESS_6_9 = EMR_SERVERLESS_BASE_URL + 'emr-6.9.0:latest',
  EMR_EKS_6_12 = EMR_EKS_BASE_URL + 'emr-6.12.0:latest',
  EMR_EKS_6_11 = EMR_EKS_BASE_URL + 'emr-6.11.0:latest',
  EMR_EKS_6_10 = EMR_EKS_BASE_URL + 'emr-6.10.0:latest',
  EMR_EKS_6_9 = EMR_EKS_BASE_URL + 'emr-6.9.0:latest',
}

/**
* Properties for SparkCICDPipeline class.
*/
export interface SparkCICDPipelineProps {
  /**
  * The name of the Spark application to be deployed.
  */
  readonly applicationName: string;

  /**
   * The application Stack to deploy in the different CDK Pipelines Stages
   */
  readonly applicationStackFactory: ApplicationStackFactory;

  /**
   * The path to the folder that contains the CDK Application
   * @default - The root of the repository
   */
  readonly cdkPath?: string;

  /**
   * The path to the folder that contains the Spark Application
   * @default - The root of the repository
   */
  readonly sparkPath?: string;

  /**
   * The Spark image to use to run the unit tests
   * @default - EMR Serverless v6.12 is used
   */
  readonly sparkImage?: SparkImage;

  /**
   * The path to the Shell script that contains integration tests
   * @default - No integration tests are run
   */
  readonly integTestScript?: string;

  /**
   * The environment variables to create from the Application Stack and to pass to the integration tests.
   * This is used to interact with resources created by the Application Stack from within the integration tests script.
   * Key is the name of the environment variable to create. Value is generally a CfnOutput name from the Application Stack.
   * @default - No environment variables
   */
  readonly integTestEnv?: Record<string, string>;
}

/**
* A CDK Construct that creates a Spark CICD Pipeline.
* The construct provisions a CDK Pipeline with the following resources:
*  * A CodeCommit repository to host the code
*  * A CodePipeline triggered from the main branch of the CodeCommit repository
*  * A CodeBuild stage to build the CDK assets and run the Spark unit tests
*  * A Staging stage to deploy the application stack in the staging account and run optional integration tests
*  * A Production stage to deploy the application stack in the production account
*
* If using different accounts for dev (where this construct is deployed), integration and production (where the application stack is deployed),
* bootstrap integration and production accounts with CDK and add a trust relationship from the dev account:
* ```bash
* cdk bootstrap \
*   --profile integration \
*   --trust <DEV_ACCOUNT> \
*   aws://<INTEGRATION_ACCOUNT>/us-west-2
* ```
*
* Units tests are expected to be run with `pytest` command from the Spark root folder configured via `sparkPath`.
*
* Integration tests are expected to be an AWS CLI script that return 0 exit code if success and 1 if failure configure via `integTestScript`.
* Integration tests can use resources that are deployed by the Application Stack.
* To do this, pass environment variables to the Construct in the form of key/value pairs via `integTestEnv`.
* Keys are the names of the environment variables used in the script, values are provided by the application stack
* and are generally resources ID/names/ARNs.
*
* The application stack is expected to be passed via a factory class. To do this, implement the `ApplicationStackFactory` and its `createStack()` method.
* The `createStack()` method needs to return a `ApplicationStack` instance within the scope passed to the factory method.
* This is used to create the application stack within the scope of the CDK Pipeline stage.
* The `ApplicationStack` is a standard `Stack` with an additional parameter of type `CICDStage`.
* This parameter is passed by the CDK Pipeline and allows to customize the behavior of the Stack based on the stage.
* For example, staging stage is used for integration tests so there is no reason to create a cron based trigger but the tests would manually trigger the job.
*
* **Usage example**
* ```typescript
* const stack = new Stack();
*
* class MyApplicationStack extends Stack {
*
*   constructor(scope: Stack) {
*     super(scope, 'MyApplicationStack');
*
*     const bucket = new Bucket(this, 'TestBucket', {
*       autoDeleteObjects: true,
*       removalPolicy: RemovalPolicy.DESTROY,
*     });
*
*     new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
*   }
* }
*
* class MyStackFactory implements ApplicationStackFactory {
*   createStack(scope: Stack): Stack {
*     return new MyApplicationStack(scope);
*   }
* }
*
* new SparkCICDPipeline(stack, 'TestConstruct', {
*   applicationName: 'test',
*   applicationStackFactory: new MyStackFactory(),
*   cdkPath: 'cdk/',
*   sparkPath: 'spark/',
*   sparkImage: SparkImage.EMR_SERVERLESS_6_10,
*   integTestScript: 'cdk/integ-test.sh',
*   integTestEnv: {
*     TEST_BUCKET: 'BucketName',
*   },
* });
* ```
*/
export class SparkCICDPipeline extends Construct {

  /**
   * The default Spark image to run the unit tests
   */
  private static readonly DEFAULT_SPARK_IMAGE: SparkImage = SparkImage.EMR_SERVERLESS_6_12;

  /**
   * Extract the path and the script name from a script path
   * @param path the script path
   * @return [path, scriptName]
   */
  private static extractPath(path: string): [string, string] {
    // Extract the folder from the integration tests script path
    const pathParts = path.split('/');
    var integPath = '.';
    if (pathParts.length > 1) {
      integPath = pathParts.slice(0, -1).join('/');
    }
    const integScript = pathParts[pathParts.length - 1];
    return [integPath, integScript];
  }

  /**
   * Build the install commands for the CodeBuild step based on the runtime
   * @param cdkPath the path of the CDK application
   * @return installCommands
   */
  private static cdkInstallCommands(): string[] {
    // Get the runtime of the CDK Construct
    const runtime = process.env.JSII_AGENT || 'node.js';
    var commands: string[];

    // Build the list of commands depending on the runtime
    switch (runtime.split('/')[0].toLowerCase()) {
      case 'node.js':
        commands=[
          'npm ci',
          'npm run build',
        ];
        break;
      case 'python':
        commands= [
          'pip install -r requirements.txt',
        ];
        break;
      default:
        throw new Error('Runtime not supported');
    }
    // Full set of commands
    return [
      'npm install -g aws-cdk',
    ].concat(commands);
  }

  /**
   * The CodePipeline create as part of the Spark CICD Pipeline
   */
  public readonly pipeline: CodePipeline;

  /**
   * Construct a new instance of the SparkCICDPipeline class.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {SparkCICDPipelineProps} props the SparkCICDPipelineProps properties
   */
  constructor(scope: Construct, id: string, props: SparkCICDPipelineProps) {
    super(scope, id);

    // Set the defaults
    const cdkPath = props.cdkPath ? props.cdkPath : '.';
    const sparkPath = props.sparkPath ? props.sparkPath : '.';
    const sparkImage = props.sparkImage ? props.sparkImage : SparkCICDPipeline.DEFAULT_SPARK_IMAGE;

    // Create a CodeCommit repository to host the code
    const codeRepository = new Repository(this, 'CodeCommitRepository', {
      repositoryName: props.applicationName,
    });

    const buildStage = new CodeBuildStep('CodeBuildSynthStep', {
      input: CodePipelineSource.codeCommit(codeRepository, 'main'),
      commands: [
        'curl -qLk -o jq https://stedolan.github.io/jq/download/linux64/jq && chmod +x ./jq',
        'curl -qL -o aws_credentials.json http://169.254.170.2/$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
        "AWS_ACCESS_KEY_ID=$(cat aws_credentials.json | jq -r '.AccessKeyId')",
        "AWS_SECRET_ACCESS_KEY=$(cat aws_credentials.json | jq -r '.SecretAccessKey')",
        "AWS_SESSION_TOKEN=$(cat aws_credentials.json | jq -r '.Token')",
        `docker run -i -v $PWD/${sparkPath}:/home/hadoop/ -e AWS_REGION=$AWS_REGION -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN -e DISABLE_SSL=true --rm --name pytest ${sparkImage} sh -c \"curl -O https://bootstrap.pypa.io/get-pip.py && chmod +x get-pip.py && python3 get-pip.py && pip install . && pytest\"`,
        'rm -f aws_credentials.json',
        `cd ${cdkPath}`,
      ].concat(SparkCICDPipeline.cdkInstallCommands())
        .concat([
          'npx cdk synth --all',
        ]),
      primaryOutputDirectory: `${cdkPath}/cdk.out`,
    });

    // Create the CodePipeline to run the CICD
    this.pipeline = new CodePipeline(this, 'CodePipeline', {
      crossAccountKeys: true,
      enableKeyRotation: true,
      useChangeSets: false,
      synth: buildStage,
      dockerEnabledForSynth: true,
    });

    // Create the Staging stage of the CICD
    const staging = new ApplicationStage(this, 'Staging', {
      env: {
        account: process.env.STAGING_ACCOUNT,
        region: process.env.STAGING_REGION,
      },
      applicationStackFactory: props.applicationStackFactory,
      outputsEnv: props.integTestEnv,
      stage: CICDStage.STAGING,
    });
    const stagingDeployment = this.pipeline.addStage(staging);

    if (props.integTestScript) {
      // Extract the path and script name from the integration tests script path
      const [integPath, integScript] = SparkCICDPipeline.extractPath(props.integTestScript);

      // Add a post step to run the integration tests
      stagingDeployment.addPost(new ShellStep('IntegrationTests', {
        input: buildStage.addOutputDirectory(integPath),
        commands: [`cd ${integPath} && ./${integScript}`],
        envFromCfnOutputs: staging.stackOutputsEnv,
      }));
    }

    // Create the Production stage of the CICD
    this.pipeline.addStage(new ApplicationStage(this, 'Production', {
      env: {
        account: process.env.PROD_ACCOUNT,
        region: process.env.PROD_REGION,
      },
      applicationStackFactory: props.applicationStackFactory,
      stage: CICDStage.PROD,
    }));

    // Create a CfnOutput to display the CodeCommit repository URL
    new CfnOutput(this, 'CodeCommitRepositoryUrl', {
      value: codeRepository.repositoryCloneUrlHttp,
    });
  }
}
