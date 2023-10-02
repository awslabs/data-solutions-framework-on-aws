// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { TrackedConstruct, TrackedConstructProps } from '../../utils';
import { PySparkApplicationPackageProps } from './pyspark-application-package-props'
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, BundlingOutput, Size, DockerImage } from 'aws-cdk-lib/core';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

/**
*
*/
export class PySparkApplicationPackage extends TrackedConstruct {


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

    const artifactsBucket = new Bucket(this, 'ArtifactsBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Build dependencies using the Dockerfile in app/ folder and deploy a zip into CDK asset bucket
    const emrDepsAsset = new Asset(this, 'EmrDepsAsset', {
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

    // Move the asset with dependencies into the artifact bucket (because it's a different lifecycle than the CDK app)
    const emrDepsArtifacts = new BucketDeployment(this, 'EmrDepsArtifacts', {
      sources: [
        Source.bucket(
          emrDepsAsset.bucket,
          emrDepsAsset.s3ObjectKey
        ),
      ],
      destinationBucket: artifactsBucket,
      destinationKeyPrefix: 'emr-artifacts',
      memoryLimit: 512,
      ephemeralStorageSize: Size.mebibytes(3000),
      prune: false,
      extract: false,
    });

    // Deploy a zip of the Pyspark entrypoint into the CDK asset bucket
    // We are using an S3 asset because the name of the file changes each time we deploy the app
    // If we used an S3 deployment directly, the entrypoint would still have the same name, and the resource wouldn't be updated by CDK
    const emrAppAsset = new Asset(this, 'EmrAppAsset', {
      path: '',
      bundling: {
        image: DockerImage.fromRegistry('public.ecr.aws/docker/library/alpine:latest'),
        outputType: BundlingOutput.NOT_ARCHIVED,
        command: [
          'sh',
          '-c',
          'cp /asset-input/app-pyspark.py /asset-output/',
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
      destinationBucket: artifactsBucket,
      destinationKeyPrefix: 'emr-artifacts',
      memoryLimit: 512,
      ephemeralStorageSize: Size.mebibytes(3000),
      prune: false,
    });

  }


}