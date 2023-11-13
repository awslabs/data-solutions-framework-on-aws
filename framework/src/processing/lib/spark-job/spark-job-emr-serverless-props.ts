// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Simplified configuration for the EMR Serverless Job.
 * @param name Spark job name @default Autogenerated
 * @param applicationId EMR Serverless application ID
 * @param executionRoleArn EMR Serverless execution role ARN
 * @param sparkSubmitEntryPoint The entry point for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html)
 * @param sparkSubmitEntryPointArguments The arguments for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html)
 * @param sparkSubmitParameters The parameters for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html)
 * @param applicationConfiguration The override configurations for the application. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ConfigurationOverrides.html)
 * @param executionTimeoutMinutes Job execution timeout in minutes. @default 30
 * @param persistentAppUi Enable Persistent UI. @default true @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ManagedPersistenceMonitoringConfiguration.html)
 * @param persistentAppUIKeyArn Persistent application UI encryption key ARN @default AWS Managed default KMS key used @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ManagedPersistenceMonitoringConfiguration.html)
 * @param s3LogUri The Amazon S3 destination URI for log publishing. Example: s3://BUCKET_NAME/ @default Create new bucket. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_S3MonitoringConfiguration.html)
 * @param s3LogUriKeyArn KMS Encryption key for S3 log monitoring bucket. @default AWS Managed default KMS key used. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_S3MonitoringConfiguration.html)
 * @param cloudWatchLogGroupName CloudWatch log group name for job monitoring.  @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchEncryptionKeyArn CloudWatch log encryption key ARN. @default AWS Managed default KMS key used. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchLogGroupStreamPrefix CloudWatch log group stream prefix. @default The name of the spark job. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchLogtypes CloudWatch log verbosity type. @default ERROR @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param tags Tags to be added to the EMR Serverless job. @see @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
 */
import { SparkJobProps } from './spark-job-props';

export interface SparkEmrServerlessJobProps extends SparkJobProps {
  readonly name: string;
  readonly applicationId: string;
  readonly executionRoleArn?: string;
  readonly sparkSubmitEntryPoint: string;
  readonly sparkSubmitEntryPointArguments?: string[];
  readonly sparkSubmitParameters?: string;
  readonly applicationConfiguration?: { [key: string]: any };
  readonly executionTimeoutMinutes?: number;
  readonly persistentAppUi?: boolean;
  readonly persistentAppUIKeyArn?: string;
  readonly s3LogUri?: string;
  readonly s3LogUriKeyArn?: string;
  readonly cloudWatchLogGroupName?: string;
  readonly cloudWatchEncryptionKeyArn?: string;
  readonly cloudWatchLogGroupStreamPrefix?: string;
  readonly cloudWatchLogtypes?: string;
  readonly tags?: {[key: string]: any};
}


/**
 * Configuration for the EMR Serverless Job API.
 * Use this interface when EmrServerlessJobProps doesn't give you access to the configuration parameters you need.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
 */

export interface SparkEmrServerlessJobApiProps extends SparkJobProps {

  /**
   * EMR Serverless Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {[key: string] : any};
}