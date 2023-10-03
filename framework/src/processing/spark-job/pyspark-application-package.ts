// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { ManagedPolicy, ServicePrincipal, IRole, PolicyStatement, Effect, Role } from 'aws-cdk-lib/aws-iam';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { RemovalPolicy, BundlingOutput, Size, DockerImage, Aws } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { PySparkApplicationPackageProps } from './pyspark-application-package-props';
import { TrackedConstruct, TrackedConstructProps } from '../../utils';

/**
*
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
  public readonly depsS3Uri: string;


  /**
   * A bucker is created and exposed as an attribute
   * The bucket object where your assets are stored
   * A bucket is created for you if you do not provide on in the props
   */
  public readonly assetBucket: IBucket;


  /**
   * The role used by the BucketDeployment to upload the artifacts to the artifact S3 bucket
   * A role
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

      artifactsBucket = new Bucket(this, `ArtifactsBucket-${props.pysparkApplicationName}`, {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      artifactsBucket.grantWrite(assetUploadBucketRole);

    } else {
      artifactsBucket = props.artifactsBucket!;
    }

    // Build dependencies using the Dockerfile in app/ folder and deploy a zip into CDK asset bucket
    const emrDepsAsset = new Asset(this, `EmrDepsAsset-${props.pysparkApplicationName}`, {
      path: props.depenciesPath,
      bundling: {
        image: DockerImage.fromBuild(props.depenciesPath),
        outputType: BundlingOutput.ARCHIVED,
        command: [
          'sh',
          '-c',
          'cp /output/pyspark-env.tar.gz /asset-output/',
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
      path: '',
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

    this.entrypointS3Uri = emrAppArtifacts.deployedBucket.s3UrlForObject(emrAppArtifacts.objectKeys[0]);
    this.depsS3Uri = emrDepsArtifacts.deployedBucket.s3UrlForObject(emrDepsArtifacts.objectKeys[0]);
    this.assetBucket = artifactsBucket;
    this.assetUploadBucketRole = assetUploadBucketRole;

  }


}