// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IBucket } from 'aws-cdk-lib/aws-s3';


/**
 * Properties for the {PySparkApplicationPackage} construct
 */
export interface PySparkApplicationPackageProps {


  /**
   * The source directory where you have `requirements.txt` or `pyproject.toml`
   * This location must have a `Dockerfile` that will build the archive of the virtual environment
   */
  readonly entrypointPath: string;

  /**
   * The source directory where you have `requirements.txt` or `pyproject.toml`
   * This location must have a `Dockerfile` that will build the archive of the virtual environment
   */
  readonly entrypointFileName: string;

  /**
   * The source directory where you have `requirements.txt` or `pyproject.toml`
   * This location must have a `Dockerfile` that will build the archive of the virtual environment
   */
  readonly dependenciesPath: string;

  /**
    * The name of the pyspark application
    * This name is used as a parent directory in s3
    * to store the entrypoint as well as virtual environment archive
   */
  readonly pysparkApplicationName: string;

  /**
   * The S3 bucket where to upload the artifacts of the Spark Job
   * This is where the entry point and archive of the virtual environment will be stored
   * @default If no bucket is provided, one will be created for you
   *
   */
  readonly artifactsBucket?: IBucket;


  /**
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket
   * If DESTROY is selected, context value
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

}