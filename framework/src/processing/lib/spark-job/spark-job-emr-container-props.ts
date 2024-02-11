// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { SparkJobProps } from './spark-job-props';
import { EmrRuntimeVersion } from '../emr-releases';

/**
 * Simplified configuration for the `SparkEmrEksJob` construct.
 */
export interface SparkEmrContainerJobProps extends SparkJobProps {

  /**
   * The Spark job name.
   */
  readonly name: string;

  /**
   * The EMR on EKS virtual cluster ID
   */
  readonly virtualClusterId: string;

  /**
   * The EMR release version associated with the application.
   * The EMR release can be found in this [documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-components.html)
   * @default [EMR_DEFAULT_VERSION](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/emr-releases.ts#L46)
   */
  readonly releaseLabel?: EmrRuntimeVersion;

  /**
   * The IAM execution Role ARN for the EMR on EKS job.
   */
  readonly executionRole: IRole;

  /**
   * The entry point for the Spark submit job run. @see https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html
   */
  readonly sparkSubmitEntryPoint: string;

  /**
   * The arguments for the Spark submit job run. @see https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html
   * @default - No arguments are passed to the job.
   */
  readonly sparkSubmitEntryPointArguments?: string[];

  /**
   * The parameters for the Spark submit job run. @see https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html
   * @default - No parameters are passed to the job.
   */
  readonly sparkSubmitParameters?: string;

  /**
   * The application configuration override for the Spark submit job run. @see https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html
   * @default - No configuration is passed to the job.
   */
  readonly applicationConfiguration?:{[key: string] : any};

  /**
   * The execution timeout.
   * @default - 30 minutes
   */
  readonly executionTimeout?: Duration;

  /**
   * The maximum number of retries.
   * @default - No retry
   */
  readonly maxRetries?: number;

  /**
   * The S3 Bucket for log publishing.
   * @default - No logging to S3
   */
  readonly s3LogBucket?: IBucket;
  /**
   * The S3 Bucket prefix for log publishing.
   * @default - No logging to S3
   */
  readonly s3LogPrefix?: string;

  /**
   * The CloudWatch Log Group name for log publishing.
   * @default - CloudWatch is not used for logging
   */
  readonly cloudWatchLogGroup?: ILogGroup;

  /**
   * The CloudWatch Log Group stream prefix for log publishing.
   * @default - The application name is used as the prefix
   */
  readonly cloudWatchLogGroupStreamPrefix?: string;

  /**
   * Tags to be added to the EMR Serverless job.
   * @default - No tags are added
   */
  readonly tags?: {
    [key:string] : any;
  };
}

/**
 * Configuration for the EMR on EKS job.
 * Use this interface when `SparkEmrContainerJobProps` doesn't give you access to the configuration parameters you need.
 * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface SparkEmrContainerJobApiProps extends SparkJobProps {

  /**
   * Job execution timeout.
   * @default - 30 minutes
   */
  readonly executionTimeout?: Duration;

  /**
   * EMR on EKS StartJobRun API configuration
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {[key: string] : any};
}