// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';


/**
 * Properties for the `PySparkApplicationPackage` construct
 */
export interface PySparkApplicationPackageProps {

  /**
    * The name of the PySpark application.
    * This name is used as a parent directory in S3 to store the entrypoint and the optional virtual environment archive
   */
  readonly applicationName: string;

  /**
   * The source path in the code base where the entrypoint is stored.
   * example `~/my-project/src/entrypoint.py`
   */
  readonly entrypointPath: string;

  /**
   * The source directory where `requirements.txt` or `pyproject.toml` file is stored. These files are used to install external AND internal Python packages.
   * If your PySpark application has more than one Python file, you need to [package your Python project](https://packaging.python.org/en/latest/tutorials/packaging-projects/).
   * This location must also contain a `Dockerfile` that can
   * [create a virtual environment and build an archive](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/using-python-libraries.html#building-python-virtual-env).
   * @default - No dependencies (internal or external) are packaged. Only the entrypoint is used in the Spark Job.
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
   * @default - An S3 Bucket is created
   */
  readonly artifactsBucket?: IBucket;

  /**
   * The IAM Role used by the Lambda function. Additional permissions would be granted to this role such as S3 Bucket permissions.
   * @default - A new Role would be created with least privilege permissions
   */
  readonly assetUploadRole?: IRole;

  /**
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket.
   * If DESTROY is selected, the context value '@data-solutions-framework-on-aws/removeDataOnDestroy'
   * in the 'cdk.json' or 'cdk.context.json' must be set to true.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

}