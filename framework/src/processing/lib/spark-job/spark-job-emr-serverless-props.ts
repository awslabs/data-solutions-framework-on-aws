// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Simplified configuration for the `SparkEmrServerlessJob` construct.
 */
import { Duration } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { SparkJobProps } from './spark-job-props';

export interface SparkEmrServerlessJobProps extends SparkJobProps {

  /**
   * The Spark Job name.
   */
  readonly name: string;

  /**
   * The EMR Serverless Application to execute the Spark Job.
   */
  readonly applicationId: string;

  /**
   * The IAM execution Role for the EMR Serverless job.
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
  readonly applicationConfiguration?: { [key: string]: any };

  /**
   * The execution timeout.
   * @default - 30 minutes
   */
  readonly executionTimeout?: Duration;

  /**
   * Enable Spark persistent UI logs in EMR managed storage.
   * @default - true
   */
  readonly persistentAppUi?: boolean;

  /**
   * The KMS Key ARN to encrypt Spark persistent UI logs in EMR managed storage.
   * @default - Use EMR managed Key
   */
  readonly persistentAppUIKey?: IKey;

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
   * The KMS Key for encrypting logs on S3.
   * @default - No encryption
   */
  readonly s3LogEncryptionKey?: IKey;

  /**
   * The CloudWatch Log Group name for log publishing.
   * @default - No logging to CloudWatch
   */
  readonly cloudWatchLogGroup?: ILogGroup;

  /**
   * The KMS Key for encrypting logs on CloudWatch.
   * @default - No encryption
   */
  readonly cloudWatchEncryptionKey?: IKey;

  /**
   * The CloudWatch Log Group Stream prefix for log publishing.
   * @default - No prefix is used
   */
  readonly cloudWatchLogGroupStreamPrefix?: string;

  /**
   * The types of logs to log in CloudWatch Log.
   */
  readonly cloudWatchLogtypes?: string;

  /**
   * Tags to be added to the EMR Serverless job.
   * @default - No tags are added
   */
  readonly tags?: {[key: string]: any};
}


/**
 * Configuration for the EMR Serverless Job API.
 * Use this interface when `SparkEmrServerlessJobProps` doesn't give you access to the configuration parameters you need.
 * @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
 */
export interface SparkEmrServerlessJobApiProps extends SparkJobProps {

  /**
   * EMR Serverless Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {[key: string] : any};
}