// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { Effect, IManagedPolicy, IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Aws, BundlingOutput, DockerImage, RemovalPolicy, Size } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { PySparkApplicationPackageProps } from './pyspark-application-package-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';


/**
 * A construct that takes your PySpark application, packages its virtual environment and uploads it along its entrypoint to an Amazon S3 bucket
 * This construct requires Docker daemon installed locally to run.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/pyspark-application-package
 *
 * @example
 * let pysparkPacker = new dsf.processing.PySparkApplicationPackage (this, 'pysparkPacker', {
 *   applicationName: 'my-pyspark',
 *   entrypointPath: '/Users/my-user/my-spark-job/app/app-pyspark.py',
 *   dependenciesFolder: '/Users/my-user/my-spark-job/app',
 *   removalPolicy: cdk.RemovalPolicy.DESTROY,
 * });
 *
 * let sparkEnvConf: string = `--conf spark.archives=${pysparkPacker.venvArchiveS3Uri} --conf spark.emr-serverless.driverEnv.PYSPARK_DRIVER_PYTHON=./environment/bin/python --conf spark.emr-serverless.driverEnv.PYSPARK_PYTHON=./environment/bin/python --conf spark.emr-serverless.executorEnv.PYSPARK_PYTHON=./environment/bin/python`
 *
 * new dsf.processing.SparkEmrServerlessJob(this, 'SparkJobServerless', {
 *   name: 'MyPySpark',
 *   applicationId: 'xxxxxxxxx',
 *   executionRoleArn: 'ROLE-ARN',
 *   executionTimeoutMinutes: 30,
 *   s3LogUri: 's3://s3-bucket/monitoring-logs',
 *   cloudWatchLogGroupName: 'my-pyspark-serverless-log',
 *   sparkSubmitEntryPoint: `${pysparkPacker.entrypointS3Uri}`,
 *   sparkSubmitParameters: `--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4 ${sparkEnvConf}`,
 * } as dsf.processing.SparkEmrServerlessJobProps);
 */
export class PySparkApplicationPackage extends TrackedConstruct {

  /**
   * The prefix used to store artifacts on the artifact bucket
   */
  public static readonly ARTIFACTS_PREFIX = 'emr-artifacts';

  /**
   * The S3 location where the entry point is saved in S3.
   * You pass this location to your Spark job.
   */
  public readonly entrypointS3Uri: string;

  /**
   * The S3 location where the archive of the Python virtual environment with all dependencies is stored.
   * You pass this location to your Spark job.
   */
  public readonly venvArchiveS3Uri?: string;

  /**
   * The Spark config containing the configuration of virtual environment archive with all dependencies.
   */
  public readonly sparkVenvConf?: string;

  /**
   * The bucket storing the artifacts (entrypoint and virtual environment archive).
   */
  public readonly artifactsBucket: IBucket;

  /**
   * The role used by the BucketDeployment to upload the artifacts to an s3 bucket.
   * In case you provide your own bucket for storing the artifacts (entrypoint and virtual environment archive),
   * you must provide s3 write access to this role to upload the artifacts.
   */
  public readonly assetUploadRole: IRole;

  /**
   * The IAM managed policy used by the custom resource for the assets deployment
   */
  public readonly assetUploadManagedPolicy: IManagedPolicy;

  /**
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param props {@link PySparkApplicationPackageProps}
   */
  constructor(scope: Construct, id: string, props: PySparkApplicationPackageProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: PySparkApplicationPackage.name,
    };

    super(scope, id, trackedConstructProps);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    const entrypointFileName = path.basename(props.entrypointPath);
    const entrypointDirectory = path.dirname(props.entrypointPath);

    let s3DeploymentLambdaPolicyStatement: PolicyStatement[] = [];

    s3DeploymentLambdaPolicyStatement.push(new PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`],
      effect: Effect.ALLOW,
    }));

    // Policy to allow lambda access to cloudwatch logs
    this.assetUploadManagedPolicy = new ManagedPolicy(this, 's3BucketDeploymentPolicy', {
      statements: s3DeploymentLambdaPolicyStatement,
      description: 'Policy used by S3 deployment cdk construct for PySparkApplicationPackage',
    });

    // Create or use the passed `assetUploadRole` as an execution role for the lambda and attach to it a policy formed from user input
    this.assetUploadRole = props.assetUploadRole || new Role(this, 's3BucketDeploymentRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role used by S3 deployment cdk construct for PySparkApplicationPackage',
      managedPolicies: [this.assetUploadManagedPolicy],
    });

    let artifactsBucket: IBucket;

    if (!props.artifactsBucket) {

      artifactsBucket = new Bucket(this, 'ArtifactBucket', {
        encryption: BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: removalPolicy,
        autoDeleteObjects: removalPolicy === RemovalPolicy.DESTROY,
        serverAccessLogsPrefix: 'access-logs',
      });
    } else {
      artifactsBucket = props.artifactsBucket!;
    }
    artifactsBucket.grantWrite(this.assetUploadRole);

    // package dependencies if there are any
    if (props.dependenciesFolder) {

      // The sparkVenvArchivePath is required if there are dependencies
      if (!props.venvArchivePath) {
        throw new Error('Virtual environment archive path is required if there are dependencies');
      } else {

        const venvArchiveFileName = path.basename(props.venvArchivePath);

        // Build dependencies using the Dockerfile in app/ folder and deploy a zip into CDK asset bucket
        const emrDepsAsset = new Asset(this, 'EmrDepsAsset', {
          path: props.dependenciesFolder,
          bundling: {
            image: DockerImage.fromBuild(props.dependenciesFolder),
            outputType: BundlingOutput.ARCHIVED,
            command: [
              'sh',
              '-c',
              `cp ${props.venvArchivePath} /asset-output/`,
            ],
          },
        });

        emrDepsAsset.bucket.grantRead(this.assetUploadRole);

        // Move the asset with dependencies into the artifact bucket (because it's a different lifecycle than the CDK app)
        const emrDepsArtifacts = new BucketDeployment(this, 'EmrDepsArtifacts', {
          sources: [
            Source.bucket(
              emrDepsAsset.bucket,
              emrDepsAsset.s3ObjectKey,
            ),
          ],
          destinationBucket: artifactsBucket!,
          destinationKeyPrefix: `${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${props.applicationName}`,
          memoryLimit: 512,
          ephemeralStorageSize: Size.mebibytes(1000),
          prune: false,
          extract: false,
          role: this.assetUploadRole,
          retainOnDelete: removalPolicy === RemovalPolicy.RETAIN,
        });

        this.venvArchiveS3Uri = emrDepsArtifacts.deployedBucket.s3UrlForObject(`${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${props.applicationName}/${venvArchiveFileName}`);
      }
    }

    // Deploy a zip of the Pyspark entrypoint into the CDK asset bucket
    // We are using an S3 asset because the name of the file changes each time we deploy the app
    // If we used an S3 deployment directly, the entrypoint would still have the same name, and the resource wouldn't be updated by CDK
    const emrAppAsset = new Asset(this, 'EmrAppAsset', {
      path: entrypointDirectory,
      bundling: {
        image: DockerImage.fromRegistry('public.ecr.aws/docker/library/alpine:latest'),
        outputType: BundlingOutput.NOT_ARCHIVED,
        command: [
          'sh',
          '-c',
          `cp /asset-input/${entrypointFileName} /asset-output/`,
        ],
      },
    });

    // Move the asset with the Pyspark entrypoint into the artifact bucket (because it's a different lifecycle than the CDK app)
    const emrAppArtifacts = new BucketDeployment(this, 'EmrAppArtifacts', {
      sources: [
        Source.bucket(
          emrAppAsset.bucket,
          emrAppAsset.s3ObjectKey,
        ),
      ],
      destinationBucket: artifactsBucket!,
      destinationKeyPrefix: `${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${props.applicationName}`,
      memoryLimit: 512,
      ephemeralStorageSize: Size.mebibytes(1000),
      prune: false,
      role: this.assetUploadRole,
      retainOnDelete: removalPolicy === RemovalPolicy.RETAIN,
    });

    this.entrypointS3Uri = emrAppArtifacts.deployedBucket.s3UrlForObject(`${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${props.applicationName}/${entrypointFileName}`);

    this.artifactsBucket = artifactsBucket;
    this.sparkVenvConf = `--conf spark.archives=${this.venvArchiveS3Uri} --conf spark.emr-serverless.driverEnv.PYSPARK_DRIVER_PYTHON=./environment/bin/python --conf spark.emr-serverless.driverEnv.PYSPARK_PYTHON=./environment/bin/python --conf spark.emr-serverless.executorEnv.PYSPARK_PYTHON=./environment/bin/python`;

  }
}