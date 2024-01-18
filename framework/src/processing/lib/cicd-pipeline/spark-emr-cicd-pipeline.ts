// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, CfnOutput, RemovalPolicy, ResourceEnvironment } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { SparkEmrCICDPipelineProps } from './spark-emr-cicd-pipeline-props';
import { AccessLogsBucket } from '../../../storage';
import {
  ApplicationStage,
  CICDStage,
  Context,
  TrackedConstruct,
  TrackedConstructProps,
} from '../../../utils';
import { DEFAULT_SPARK_IMAGE, SparkImage } from '../emr-releases';


/**
 * A CICD Pipeline that tests and deploys a Spark application in cross-account environments using CDK Pipelines.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Processing/spark-cicd-pipeline
 *
 * @exampleMetadata fixture=imports-only
 * @example
 * import { Bucket } from 'aws-cdk-lib/aws-s3';
 *
 * interface MyApplicationStackProps extends cdk.StackProps {
 *   readonly stage: dsf.utils.CICDStage;
 * }
 *
 * class MyApplicationStack extends cdk.Stack {
 *   constructor(scope: cdk.Stack, props?: MyApplicationStackProps) {
 *     super(scope, 'MyApplicationStack');
 *     const bucket = new Bucket(this, 'TestBucket', {
 *       autoDeleteObjects: true,
 *       removalPolicy: cdk.RemovalPolicy.DESTROY,
 *     });
 *     new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
 *   }
 * }
 *
 * class MyStackFactory implements dsf.utils.ApplicationStackFactory {
 *   createStack(scope: cdk.Stack, stage: dsf.utils.CICDStage): cdk.Stack {
 *     return new MyApplicationStack(scope, { stage });
 *   }
 * }
 *
 * class MyCICDStack extends cdk.Stack {
 *   constructor(scope: Construct, id: string) {
 *     super(scope, id);
 *     new dsf.processing.SparkEmrCICDPipeline(this, 'TestConstruct', {
 *        sparkApplicationName: 'test',
 *        applicationStackFactory: new MyStackFactory(),
 *        cdkApplicationPath: 'cdk/',
 *        sparkApplicationPath: 'spark/',
 *        sparkImage: dsf.processing.SparkImage.EMR_6_12,
 *        integTestScript: 'cdk/integ-test.sh',
 *        integTestEnv: {
 *          TEST_BUCKET: 'BucketName',
 *        },
 *     });
 *   }
 * }
 */
export class SparkEmrCICDPipeline extends TrackedConstruct {

  /**
   * Extract the path and the script name from a script path
   * @param path the script path
   * @return [path, scriptName]
   */
  private static extractPath(path: string): [string, string] {
    const pathParts = path.split('/');
    const integPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '.';
    const integScript = pathParts[pathParts.length - 1];

    return [integPath, integScript];
  }

  /**
   * Build the install commands for the CodeBuild step based on the runtime
   * @param cdkPath the path of the CDK application
   * @param sparkPath the path of the Spark application
   * @return installCommands
   */
  private static synthCommands(cdkPath: string, sparkPath: string, sparkImage: SparkImage): string[] {
    // Get the runtime of the CDK Construct
    const runtime = process.env.JSII_AGENT || 'node.js';
    let commands = [
      'curl -qLk -o jq https://stedolan.github.io/jq/download/linux64/jq && chmod +x ./jq',
      'curl -qL -o aws_credentials.json http://169.254.170.2/$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
      "eval \"$(jq -r '@sh \"AWS_ACCESS_KEY_ID=\\\(.AccessKeyId) AWS_SECRET_ACCESS_KEY=\\\(.SecretAccessKey) AWS_SESSION_TOKEN=\\\(.Token)\"' aws_credentials.json)\"",
      'rm -f aws_credentials.json',
      `chmod -R o+w $(pwd)/${sparkPath}`,
      `docker run -i -v $(pwd)/${sparkPath}:/home/hadoop/ -e AWS_REGION=$AWS_REGION -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN -e DISABLE_SSL=true --rm --name pytest ${sparkImage} sh -c \"export PATH=$PATH:/home/hadoop/.local/bin && export PYTHONPATH=$PYTHONPATH:/usr/lib/spark/python/lib/py4j-src.zip:/usr/lib/spark/python && python3 -m pip install pytest . && python3 -m pytest\"`,
      `cd ${cdkPath}`,
      'npm install -g aws-cdk',
    ];

    // Build the list of commands depending on the runtime
    switch (runtime.split('/')[0].toLowerCase()) {
      case 'node.js':
        commands = commands.concat([
          'npm ci',
          'npm run build',
        ]);
        break;
      case 'python':
        commands = commands.concat([
          'pip install -r requirements.txt',
        ]);
        break;
      default:
        throw new Error('Runtime not supported');
    }
    // Full set of commands
    return commands.concat(['npx cdk synth --all']);
  }

  /**
   * The CodePipeline created as part of the Spark CICD Pipeline
   */
  public readonly pipeline: CodePipeline;
  /**
   * The CodeCommit repository created as part of the Spark CICD Pipeline
   */
  public readonly repository: Repository;
  /**
   * The S3 bucket for storing the artifacts
   */
  public readonly artifactBucket: IBucket;
  /**
   * The S3 bucket for storing access logs on the artifact bucket
   */
  public readonly artifactAccessLogsBucket: IBucket;
  /**
   * The CloudWatch Log Group for storing the CodePipeline logs
   */
  public readonly pipelineLogGroup: ILogGroup;
  /**
   * The CodeBuild Step for the staging stage
   */
  public readonly integrationTestStage?: CodeBuildStep;
  /**
   * Construct a new instance of the SparkCICDPipeline class.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {SparkEmrCICDPipelineProps} props the SparkCICDPipelineProps properties
   */
  constructor(scope: Construct, id: string, props: SparkEmrCICDPipelineProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: SparkEmrCICDPipeline.name,
    };

    super(scope, id, trackedConstructProps);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    // Set the defaults
    const cdkPath = props.cdkApplicationPath ? props.cdkApplicationPath : '.';
    const sparkPath = props.sparkApplicationPath ? props.sparkApplicationPath : '.';
    const sparkImage = props.sparkImage ? props.sparkImage : DEFAULT_SPARK_IMAGE;

    // Create a CodeCommit repository to host the code
    this.repository = new Repository(this, 'CodeCommitRepository', {
      repositoryName: props.sparkApplicationName,
    });

    const buildStage = new CodeBuildStep('CodeBuildSynthStep', {
      input: CodePipelineSource.codeCommit(this.repository, 'main'),
      commands: SparkEmrCICDPipeline.synthCommands(cdkPath, sparkPath, sparkImage),
      primaryOutputDirectory: `${cdkPath}/cdk.out`,
    });

    this.artifactAccessLogsBucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
      removalPolicy: props?.removalPolicy,
    });

    const artifactBucketKey = new Key(this, 'ArtifactBucketKey', {
      removalPolicy,
      enableKeyRotation: true,
    });

    this.artifactBucket = new Bucket(this, 'ArtifactBucket', {
      enforceSSL: true,
      encryption: BucketEncryption.KMS,
      encryptionKey: artifactBucketKey,
      removalPolicy,
      serverAccessLogsBucket: this.artifactAccessLogsBucket,
      autoDeleteObjects: removalPolicy == RemovalPolicy.DESTROY,
    });

    this.pipelineLogGroup = new LogGroup(this, 'BuildLogGroup', {
      removalPolicy: removalPolicy,
    }),
    // Create the CodePipeline to run the CICD
    this.pipeline = new CodePipeline(this, 'CodePipeline', {
      crossAccountKeys: true,
      enableKeyRotation: true,
      useChangeSets: false,
      synth: buildStage,
      dockerEnabledForSynth: true,
      artifactBucket: this.artifactBucket,
      codeBuildDefaults: {
        logging: {
          cloudWatch: {
            logGroup: this.pipelineLogGroup,
          },
        },
      },
    });

    // Create the Staging stage of the CICD
    const staging = new ApplicationStage(this, 'Staging', {
      env: this.getAccountFromContext('staging'),
      applicationStackFactory: props.applicationStackFactory,
      outputsEnv: props.integTestEnv,
      stage: CICDStage.STAGING,
    });
    const stagingDeployment = this.pipeline.addStage(staging);

    if (props.integTestScript) {
      // Extract the path and script name from the integration tests script path
      const [integPath, integScript] = SparkEmrCICDPipeline.extractPath(props.integTestScript);

      this.integrationTestStage = new CodeBuildStep('IntegrationTests', {
        input: buildStage.addOutputDirectory(integPath),
        commands: [`chmod +x ${integScript} && ./${integScript}`],
        envFromCfnOutputs: staging.stackOutputsEnv,
        rolePolicyStatements: props.integTestPermissions,
      });
      // Add a post step to run the integration tests
      stagingDeployment.addPost(this.integrationTestStage);
    }

    // Create the Production stage of the CICD
    this.pipeline.addStage(new ApplicationStage(this, 'Production', {
      env: this.getAccountFromContext('prod'),
      applicationStackFactory: props.applicationStackFactory,
      stage: CICDStage.PROD,
    }));

    // Create a CfnOutput to display the CodeCommit repository URL
    new CfnOutput(this, 'CodeCommitRepositoryCommand', {
      value: `git remote add ${this.repository.repositoryName} codecommit::${Aws.REGION}://${this.repository.repositoryName}`,
    });
  }

  /**
   * Extract PROD and STAGING account IDs and regions from the CDK context
   */
  private getAccountFromContext(name: string): ResourceEnvironment {
    const account = this.node.tryGetContext(name) as ResourceEnvironment;
    if (!account) throw new Error(`Missing context variable ${name}`);
    return account;
  }
}
