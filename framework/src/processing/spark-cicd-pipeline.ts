// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { ApplicationStackFactory } from './application-stack-factory';
import { CICDStage, ApplicationStage } from './application-stage';
import { EmrVersion } from '../utils';

const EMR_EKS_BASE_URL = 'public.ecr.aws/emr-on-eks/spark/';

/**
 * The list of supported Spark images to use in the SparkCICDPipeline. 
 */
export enum SparkImage {
  EMR_6_12 = EMR_EKS_BASE_URL + EmrVersion.V6_12 + ':latest',
  EMR_6_11 = EMR_EKS_BASE_URL + EmrVersion.V6_11 + ':latest',
  EMR_6_10 = EMR_EKS_BASE_URL + EmrVersion.V6_10 + ':latest',
  EMR_6_9 = EMR_EKS_BASE_URL + EmrVersion.V6_9 + ':latest',
}

/**
 * The account information for deploying the Application stack
 */
export interface AccountInfo {
  /**
   * The account ID to deploy the Application stack
   */
  readonly accountId: string;

  /**
   * The region to deploy the Application stack
   */
  readonly region: string;
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
   * The Docker image to use in the unit tests
   * @default - The latest EMR docker image 
   */
  readonly dockerImage?: string;

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
   * The EMR Spark image to use to run the unit tests
   * @default - EMR v6.12 is used
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

  /**
   * The IAM policy statements to add permissions for running the integration tests.
   * @default - No permissions
   */
  readonly integTestPermissions?: PolicyStatement[];
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
* If using different accounts for dev (where this construct is deployed), staging and production (where the application stack is deployed),
* bootstrap integration and production accounts with CDK and add a trust relationship from the dev account:
* ```bash
* cdk bootstrap \
*   --profile integration \
*   --trust <DEV_ACCOUNT> \
*   aws://<INTEGRATION_ACCOUNT>/us-west-2
* ```
* Also provide the accounts information in the cdk.json in the form of:
*
* ```json
* {
*   "staging": {
*     "accountId": "<STAGING_ACCOUNT_ID>",
*     "region": "us-west-2"
*   },
*   "prod": {
*     "accountId": "<PROD_ACCOUNT_ID>",
*     "region": "us-west-2"
*   }
* ```
*
* Units tests are expected to be run with `pytest` command from the Spark root folder configured via `sparkPath`.
* Units tests are expected to create a Spark session with a local master and client mode.
*
* Integration tests are expected to be an AWS CLI script that return 0 exit code if success and 1 if failure configure via `integTestScript`. 
* Integration tests can use resources that are deployed by the Application Stack. 
* To do this, pass environment variables to the Construct in the form of key/value pairs via `integTestEnv`.  
* Keys are the names of the environment variables used in the script, values are provided by the application stack 
* and are generally resources ID/names/ARNs.
*
* The application stack is expected to be passed via a factory class. To do this, implement the `ApplicationStackFactory` and its `createStack()` method.
* The `createStack()` method needs to return a `Stack` instance within the scope passed to the factory method.
* This is used to create the application stack within the scope of the CDK Pipeline stage.
* The `CICDStage` parameter is passed by the CDK Pipeline and allows to customize the behavior of the Stack based on the stage.
* For example, staging stage is used for integration tests so there is no reason to create a cron based trigger but the tests would manually trigger the job.
*
* **Usage example**
* ```typescript
* const stack = new Stack();
*
* interface MyApplicationStackProps extends StackProps {
*   readonly stage: CICDStage;
* }
* class MyApplicationStack extends Stack {
*
*   constructor(scope: Stack, props?: MyApplicationStackProps) {
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
*   createStack(scope: Stack, stage: CICDStage): Stack {
*     return new MyApplicationStack(scope, { stage });
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

  // private getEnvironments(){
  //   return {
  //     staging: {
  //       account: process.env.STAGING_ACCOUNT,
  //       region: process.env.STAGING_REGION
  //     },
  //     production: {
  //       account: process.env.PRODUCTION_ACCOUNT,
  //       region: process.env.PRODUCTION_REGION
  //     }
  //   }
  // }

  /**
   * The default Spark image to run the unit tests
   */
  private static readonly DEFAULT_SPARK_IMAGE: SparkImage = SparkImage.EMR_6_12;

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
    
    // Create a CodeCommit repository to host the code
    const codeRepository = new Repository(this, 'CodeCommitRepository', {
      repositoryName: props.applicationName,
    });

    // The path containing the CDK application
    const cdkPath = props.cdkPath ? props.cdkPath : '.';

    const buildStage = new CodeBuildStep('CodeBuildSynthStep',{
      input: CodePipelineSource.codeCommit(codeRepository, 'main'),
      installCommands: this.cdkInstallCommands(cdkPath),
      commands: [
        "curl -qLk -o jq https://stedolan.github.io/jq/download/linux64/jq && chmod +x ./jq",
        "curl -qL -o aws_credentials.json http://169.254.170.2/$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
        "AWS_ACCESS_KEY_ID=$(cat aws_credentials.json | jq -r '.AccessKeyId')",
        "AWS_SECRET_ACCESS_KEY=$(cat aws_credentials.json | jq -r '.SecretAccessKey')",
        "AWS_SESSION_TOKEN=$(cat aws_credentials.json | jq -r '.Token')",
        `chmod -R o+w $(pwd)/${sparkPath}`,
        `docker run -i -v $(pwd)/${sparkPath}:/home/hadoop/ -e AWS_REGION=$AWS_REGION -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN -e DISABLE_SSL=true --rm --name pytest ${sparkImage} sh -c \"export PATH=$PATH:/home/hadoop/.local/bin && export PYTHONPATH=$PYTHONPATH:/usr/lib/spark/python/lib/py4j-src.zip:/usr/lib/spark/python && python3 -m pip install pytest . && python3 -m pytest\"`,
        'rm -f aws_credentials.json',
        "npx cdk synth --all",
      ],
      primaryOutputDirectory: `${cdkPath}/cdk.out`,
    })
    
    // Create the CodePipeline to run the CICD
    this.pipeline = new CodePipeline(this, 'CodePipeline', {
      crossAccountKeys: true,
      enableKeyRotation: true,
      useChangeSets: false,
      synth: buildStage,
    })

    // Create the Staging stage of the CICD
    const staging = new ApplicationStage(this, 'Staging', {
      env: this.getAccountFromContext('staging'),
      applicationStackFactory: props.applicationStackFactory,
      outputsEnv: props.integTestEnv,
      stage: CICDStage.STAGING,
    });
    const stagingDeployment = this.pipeline.addStage(staging);

    if (props.integTestScript){
      // Extract the path and script name from the integration tests script path
      const [integPath, integScript] = this.extractPath(props.integTestScript);

      // Add a post step to run the integration tests
      stagingDeployment.addPost(new CodeBuildStep('IntegrationTests', {
        input: buildStage.addOutputDirectory(integPath),
        commands: [`chmod +x ${integScript} && ./${integScript}`],
        envFromCfnOutputs: staging.stackOutputsEnv,
        rolePolicyStatements: props.integTestPermissions,
      }));
    }

    // Create the Production stage of the CICD
    this.pipeline.addStage(new ApplicationStage(this, 'Production', {
      env: this.getAccountFromContext('prod'),
      applicationStackFactory: props.applicationStackFactory,
      stage: CICDStage.PROD,
    }))

    // Create a CfnOutput to display the CodeCommit repository URL
    new CfnOutput(this, 'CodeCommitRepositoryUrl', {
      value: codeRepository.repositoryCloneUrlHttp,
    })
  }

  /**
   * Extract the path and the script name from a script path
   * @param path the script path
   * @return [path, scriptName]
   */
  private extractPath(path: string): [string, string] {
    // Extract the folder from the integration tests script path
    const pathParts = path.split('/');
    var integPath = '.';
    if (pathParts.length > 1){
      integPath = pathParts.slice(0, -1).join('/');
    }      
    const integScript = pathParts[pathParts.length - 1];
    return [integPath, integScript];
  }

  /**
   * Build the install commands for the CodeBuild step based on the runtime and the CDK application path
   * @param cdkPath the path of the CDK application
   * @return installCommands
   */
  private cdkInstallCommands(cdkPath: string): string[] {
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
      case 'java':
        commands= [
          'mvn compile -q',
        ]; 
        break;
      case 'dotnet':
        commands= [
          'dotnet build src',
        ]; 
        break;
      case 'go':
        commands= [
          'go get',
          'go build',
        ]; 
        break;
      default:
        throw new Error('Runtime not supported');
    }
    // Full set of commands
    return [
      `cd ${cdkPath}`,
      'npm install -g aws-cdk',
    ].concat(commands);
  }

  /**
   * Extract PROD and STAGING account IDs and regions from the CDK context
   */
  private getAccountFromContext(name: string): AccountInfo {
    const account = this.node.tryGetContext(name) as AccountInfo;
    if (!account) {throw new Error(`Missing context variable ${name}`);}
    return account;
  }
}
