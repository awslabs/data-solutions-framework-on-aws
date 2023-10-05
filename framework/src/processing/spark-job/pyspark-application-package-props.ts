// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IBucket } from 'aws-cdk-lib/aws-s3';


/**
 * Properties for the {PySparkApplicationPackage} construct
 */
export interface PySparkApplicationPackageProps {

  /**
    * The name of the pyspark application.
    * This name is used as a parent directory in s3 to store the entrypoint as well as virtual environment archive
   */
  readonly pysparkApplicationName: string;

  /**
   * The source path in your code base where you have the entrypoint stored
   * example `~/my-project/src/entrypoint.py`
   */
  readonly entrypointPath: string;

  /**
   * The source directory where you have `requirements.txt` or `pyproject.toml` that will install external AND internal Python packages.
   * If your PySpark application has more than one Python file, you need to [package your Python project](https://packaging.python.org/en/latest/tutorials/packaging-projects/).
   * This location must also have a `Dockerfile` that will
   * [create a virtual environment and build an archive](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/using-python-libraries.html#building-python-virtual-env) out of it.
   * @default - No dependencies (internal or external) are packaged. Only the entrypoint can be used in the Spark Job.
   */
  readonly dependenciesFolder?: string;

  /**
   * The path of the Python virtual environment archive generated in the Docker container.
   * This is the output path used in the `venv-pack -o` command in your Dockerfile.
   * @default - No virtual environment archive is packaged. Only the entrypoint can be used in the Spark Job. It is required if the `dependenciesFolder` is provided.
   */
  readonly venvArchivePath?: string;

  /**
   * The S3 bucket where to upload the artifacts of the Spark Job
   * This is where the entry point and archive of the virtual environment will be stored
   * @default - A bucket is created
   */
  readonly artifactsBucket?: IBucket;

  /**
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket.
   * If DESTROY is selected, the context value '@aws-data-solutions-framework/removeDataOnDestroy'
   * in the 'cdk.json' or 'cdk.context.json' must be set to true.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

}