// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SparkJobProps } from './spark-job-props';

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
   * The EMR runtime to use.
   * @default - [EMR_DEFAULT_VERSION](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/emr-releases.ts#L46)
   */
  readonly releaseLabel?: string;

  /**
   * The IAM execution Role ARN for the EMR on EKS job.
   */
  readonly executionRoleArn: string;

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
   * The execution timeout in minutes.
   * @default - 30 minutes
   */
  readonly executionTimeoutMinutes?: number;

  /**
   * The maximum number of retries.
   * @default - No retry
   */
  readonly maxRetries?: number;

  /**
   * The Amazon S3 destination URI for log publishing.
   * @default - An S3 Bucket is created
   */
  readonly s3LogUri?: string;

  /**
   * The CloudWatch Log Group name for log publishing.
   * @default - CloudWatch is not used for logging
   */
  readonly cloudWatchLogGroupName?: string;

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
   * Job execution timeout in minutes.
   * @default - 30 minutes
   */
  readonly executionTimeoutMinutes?: number;

  /**
   * EMR on EKS StartJobRun API configuration
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {[key: string] : any};
}