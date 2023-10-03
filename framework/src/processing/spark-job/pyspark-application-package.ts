// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { ManagedPolicy, ServicePrincipal, IRole, PolicyStatement, Effect, Role } from 'aws-cdk-lib/aws-iam';
import { Bucket, IBucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BundlingOutput, Size, DockerImage, Aws } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { PySparkApplicationPackageProps } from './pyspark-application-package-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../utils';

/**
* A construct that takes your pyspark application, packages its virtual environment and uploads it along its entrypoint to an Amazon S3 bucket
* This construct requires Docker daemon installed locally to run
* @example
* ```
* let pysparkPacker = new PySparkApplicationPackage (stack, 'pysparkPacker', {
*                             entrypointFileName: 'app-pyspark.py',
*                             pysparkApplicationName: 'my-pyspark',
*                             dependenciesPath: '/Users/mouhib/tech-summit-demo/app',
*                             entrypointPath: '/Users/mouhib/tech-summit-demo/app',
*                             removalPolicy: RemovalPolicy.DESTROY,
*                           });
* let sparkEnvConf: string = `--conf spark.archives=${pysparkPacker.virtualEnvironmentArchiveS3Uri} --conf spark.emr-serverless.driverEnv.PYSPARK_DRIVER_PYTHON=./environment/bin/python --conf spark.emr-serverless.driverEnv.PYSPARK_PYTHON=./environment/bin/python --conf spark.emr-serverless.executorEnv.PYSPARK_PYTHON=./environment/bin/python`
* new EmrServerlessSparkJob(stack, 'SparkJobServerless', {
*   name: 'SparkSimpleProps',
*   applicationId: 'xxxxxxxxx',
*   executionRoleArn: 'ROLE-ARN,
*   executionTimeoutMinutes: 30,
*   s3LogUri: 's3://s3-bucket/monitoring-logs',
*   cloudWatchLogGroupName: 'spark-serverless-log',
*   sparkSubmitEntryPoint: `${pysparkPacker.entrypointS3Uri}`,
*   sparkSubmitParameters: `--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4 ${sparkEnvConf}`,
* } as EmrServerlessSparkJobProps);
* ```
*/
export class PySparkApplicationPackage extends TrackedConstruct {


  /**
   * The S3 location where the entry point is saved in S3
   * You pass this location to your Spark job
   */
  public readonly entrypointS3Uri: string;

  /**
   * The S3 location where the archive of python virtual envirobment is stored
   * You pass this location to your Spark job
   */
  public readonly virtualEnvironmentArchiveS3Uri: string;


  /**
   * A bucket is created and exposed as an attribute, 
   * this bucket stores the artifacts (entrypoint and virtual environment archive) built by the construct
   * @default A bucket is created for you if you do not provide on in the props
   */
  public readonly artifactsBucket: IBucket;


  /**
   * The role used by the BucketDeployment to upload the artifacts to an s3 bucket.
   * In case you provide your own bucket for storing the artifacts (entrypoint and virtual environment archive),
   * you must provide s3 write access to this role to upload the artifacts
   */
  public readonly assetUploadBucketRole: IRole;

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

    const virtualEnvironmentArchiveName = props.virtualEnvironmentArchiveName ?? 'pyspark-env.tar.gz';

    let s3DeploymentLambdaPolicyStatement: PolicyStatement[] = [];

    s3DeploymentLambdaPolicyStatement.push(new PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`],
      effect: Effect.ALLOW,
    }));

    //Policy to allow lambda access to cloudwatch logs
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, `s3BucketDeploymentPolicy-${props.pysparkApplicationName}`, {
      statements: s3DeploymentLambdaPolicyStatement,
      description: 'Policy used by S3 deployment cdk construct for PySparkApplicationPackage',
    });

    //Create an execution role for the lambda and attach to it a policy formed from user input
    const assetUploadBucketRole = new Role(this,
      `s3BucketDeploymentRole-${props.pysparkApplicationName}`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role used by S3 deployment cdk construct for PySparkApplicationPackage',
      managedPolicies: [lambdaExecutionRolePolicy],
    });

    let artifactsBucket: IBucket;

    if (!props.artifactsBucket) {

      artifactsBucket = new Bucket(this, 'assetBucket', {
        encryption: BucketEncryption.KMS_MANAGED,
        enforceSSL: true,
        removalPolicy: removalPolicy,
        autoDeleteObjects: false,
      });

      artifactsBucket.grantWrite(assetUploadBucketRole);

    } else {
      artifactsBucket = props.artifactsBucket!;
    }

    // Build dependencies using the Dockerfile in app/ folder and deploy a zip into CDK asset bucket
    const emrDepsAsset = new Asset(this, `EmrDepsAsset-${props.pysparkApplicationName}`, {
      path: props.dependenciesPath,
      bundling: {
        image: DockerImage.fromBuild(props.dependenciesPath),
        outputType: BundlingOutput.ARCHIVED,
        command: [
          'sh',
          '-c',
          `cp /output/${virtualEnvironmentArchiveName} /asset-output/`,
        ],
      },
    });

    emrDepsAsset.bucket.grantRead(assetUploadBucketRole);

    // Move the asset with dependencies into the artifact bucket (because it's a different lifecycle than the CDK app)
    const emrDepsArtifacts = new BucketDeployment(this, `EmrDepsArtifacts-${props.pysparkApplicationName}`, {
      sources: [
        Source.bucket(
          emrDepsAsset.bucket,
          emrDepsAsset.s3ObjectKey,
        ),
      ],
      destinationBucket: artifactsBucket!,
      destinationKeyPrefix: `pyspark-appliaction-${props.pysparkApplicationName}-emr-artifacts`,
      memoryLimit: 512,
      ephemeralStorageSize: Size.mebibytes(1000),
      prune: false,
      extract: false,
      role: assetUploadBucketRole,
    });

    // Deploy a zip of the Pyspark entrypoint into the CDK asset bucket
    // We are using an S3 asset because the name of the file changes each time we deploy the app
    // If we used an S3 deployment directly, the entrypoint would still have the same name, and the resource wouldn't be updated by CDK
    const emrAppAsset = new Asset(this, `EmrAppAsset-${props.pysparkApplicationName}`, {
      path: props.entrypointPath,
      bundling: {
        image: DockerImage.fromRegistry('public.ecr.aws/docker/library/alpine:latest'),
        outputType: BundlingOutput.NOT_ARCHIVED,
        command: [
          'sh',
          '-c',
          `cp /asset-input/${props.entrypointFileName} /asset-output/`,
        ],
      },
    });

    // Move the asset with the Pyspark entrypoint into the artifact bucket (because it's a different lifecycle than the CDK app)
    const emrAppArtifacts = new BucketDeployment(this, `EmrAppArtifacts-${props.pysparkApplicationName}`, {
      sources: [
        Source.bucket(
          emrAppAsset.bucket,
          emrAppAsset.s3ObjectKey,
        ),
      ],
      destinationBucket: artifactsBucket!,
      destinationKeyPrefix: `pyspark-appliaction-${props.pysparkApplicationName}-emr-artifacts`,
      memoryLimit: 512,
      ephemeralStorageSize: Size.mebibytes(1000),
      prune: false,
      role: assetUploadBucketRole,
    });

    this.entrypointS3Uri = emrAppArtifacts.deployedBucket.s3UrlForObject(`${props.pysparkApplicationName}/${props.entrypointFileName}`);
    this.virtualEnvironmentArchiveS3Uri = emrDepsArtifacts.deployedBucket.s3UrlForObject(`${props.pysparkApplicationName}/pyspark-env.tar.gz`);
    this.artifactsBucket = artifactsBucket;
    this.assetUploadBucketRole = assetUploadBucketRole;

  }
}