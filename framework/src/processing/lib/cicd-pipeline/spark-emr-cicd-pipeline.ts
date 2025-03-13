// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy, ResourceEnvironment } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { CodeBuildStep, CodePipeline } from 'aws-cdk-lib/pipelines';
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
import { IntegrationTestStack } from '../../../utils/lib/integration-test-stack';
import { DEFAULT_SPARK_IMAGE, SparkImage } from '../emr-releases';

const MISSING_ENVIRONMENTS_ERROR = 'MissingEnvironmentsError';
const DUPLICATE_STAGE_NAME_ERROR = 'DuplicateStageNameError';

/**
 * User defined CI/CD environment stages
 */
interface CICDEnvironment {
  stageName: string;
  account: string;
  region: string;
  triggerIntegTest?: boolean;
}

/**
 * A CICD Pipeline to test and deploy a Spark application on Amazon EMR in cross-account environments using CDK Pipelines.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Processing/spark-cicd-pipeline
 *
 * @exampleMetadata fixture=imports-only
 * @example
 * import { Bucket } from 'aws-cdk-lib/aws-s3';
 * import { CodePipelineSource } from 'aws-cdk-lib/pipelines';
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
 *
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
 *        source: CodePipelineSource.connection('owner/weekly-job', 'mainline', {
 *              connectionArn: 'arn:aws:codeconnections:eu-west-1:123456789012:connection/aEXAMPLE-8aad-4d5d-8878-dfcab0bc441f'
 *        }),
 *   });
 * }
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
      'npm install -g aws-cdk esbuild',
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
   * The S3 Bucket for storing the artifacts
   */
  public readonly artifactBucket: IBucket;
  /**
   * The S3 Bucket for storing the access logs on the artifact S3 Bucket
   */
  public readonly artifactAccessLogsBucket: IBucket;
  /**
   * The CloudWatch Log Group for storing the CodePipeline logs
   */
  public readonly pipelineLogGroup: ILogGroup;
  /**
   * The ApplicationStage for the Integration Test
   */
  public readonly integrationTestStack?: IntegrationTestStack;

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

    const buildStage = new CodeBuildStep('CodeBuildSynthStep', {
      input: props.source,
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

    try {
      const environments = this.getUserDefinedEnvironmentsFromContext();
      for (const e of environments) {
        this.integrationTestStack = this.attachStageToPipeline(e.stageName.toUpperCase(), {
          account: e.account,
          region: e.region,
        }, e.triggerIntegTest || false, props);
      }
    } catch (e) {
      const error = e as Error;
      if (error.name === DUPLICATE_STAGE_NAME_ERROR) {
        throw e;
      }

      this.integrationTestStack = this.attachStageToPipeline('Staging', this.getAccountFromContext('staging'), true, props);
      this.attachStageToPipeline('Prod', this.getAccountFromContext('prod'), false, props);
    }
  }

  /**
   * Attaches the given stage to the pipeline
   * @param stageName
   * @param resourceEnvironment
   * @param attachIntegTest
   * @param props
   * @returns {IntegrationTestStack|undefined} if integration step is configured, this returns the corresponding `ApplicationStage` for the test
   */
  private attachStageToPipeline(stageName: string, resourceEnvironment: ResourceEnvironment
    , attachIntegTest: boolean
    , props: SparkEmrCICDPipelineProps): IntegrationTestStack|undefined {

    const currentStage = CICDStage.of(stageName.toUpperCase());
    const stageProps: Record<string, any> = {};
    let finalIntegTestDecision = false;
    if (attachIntegTest && props.integTestScript) {
      const [integScriptPath, integScript] = SparkEmrCICDPipeline.extractPath(props.integTestScript);
      finalIntegTestDecision = true;
      stageProps.integScriptPath = integScriptPath;
      stageProps.integTestScript = props.integTestScript;
      stageProps.integTestCommand = `chmod +x ${integScript} && ./${integScript}`;
      stageProps.integTestPermissions = props.integTestPermissions;
    }

    const applicationStage = new ApplicationStage(this, stageName, {
      env: resourceEnvironment,
      applicationStackFactory: props.applicationStackFactory,
      outputsEnv: (attachIntegTest && props.integTestScript) ? props.integTestEnv : undefined,
      stage: currentStage,
      attachIntegrationTest: finalIntegTestDecision,
      stageProps,
    });
    this.pipeline.addStage(applicationStage);

    let integrationTestStage:IntegrationTestStack|undefined = applicationStage.integrationTestStack;

    return integrationTestStage;
  }

  /**
   * Extract PROD and STAGING account IDs and regions from the CDK context
   */
  private getAccountFromContext(name: string): ResourceEnvironment {
    const account = this.node.tryGetContext(name) as ResourceEnvironment;
    if (!account) throw new Error(`Missing context variable ${name}`);
    return account;
  }

  /**
   * Retrieves the list of user defined environments from the context
   * @returns {CICDEnvironment[]} list of user defined environments
   */
  private getUserDefinedEnvironmentsFromContext(): CICDEnvironment[] {
    const environments = this.node.tryGetContext('environments') as CICDEnvironment[];
    if (!environments) {
      const missingContextError = new Error('Missing context variable environments');
      missingContextError.name = MISSING_ENVIRONMENTS_ERROR;
      throw missingContextError;
    } else {
      //check for duplicates

      const stageNameTracker = [];

      for (let e of environments) {
        if (stageNameTracker.indexOf(e.stageName) != -1) {
          const duplicateStageError = new Error('Duplicate stage name found');
          duplicateStageError.name = DUPLICATE_STAGE_NAME_ERROR;
          throw duplicateStageError;
        }

        stageNameTracker.push(e.stageName);
      }
    }

    return environments;
  }
}
