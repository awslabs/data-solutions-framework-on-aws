// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { EmrClusterTaskImplementation } from './spark-job';
import { SparkRuntimeServerless } from '../processing-runtime/spark-runtime-serverless';

/**
 * Class that provides specific implementation for EMR Serverless application
 * @implements EmrClusterTaskImplementation
 */

export class EmrServerlessTask implements EmrClusterTaskImplementation {
  /**
     * EmrServerlessConfig object that contains the configuration for the Spark job to be run using EMR Serverless.
     */
  private emrServerlessJobConfig!: EmrServerlessConfig;

  constructor(emrServerlessJobConfig: EmrServerlessConfig) {
    this.setConfig(emrServerlessJobConfig);
  }

  /**
     * Sets the config for the Spark job to be run using EMR Serverless.
     * Job run will be tagged with adsf-owned=true.
     * @param config Emr Serverless Job config
     */

  setConfig(config: EmrServerlessConfig) {
    if (!config.jobConfig.Tags) {
      config.jobConfig.Tags = {};
    }
    config.jobConfig.Tags['adsf-owned'] = 'true';
    this.emrServerlessJobConfig = config;
  }

  /**
     * Returns the props for the step function CallAwsService Construct that starts the Spark job
     * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
     * @returns CallAwsServiceProps
     */
  getJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrserverless',
      action: 'startJobRun',
      iamAction: 'emrserverless:StartJobRun',
      parameters: this.emrServerlessJobConfig.jobConfig,
      iamResources: ['*'],
      resultSelector: {
        'JobRunId.$': '$.JobRunId',
      },
    } as CallAwsServiceProps;
  }

  /**
     * Returns the props for the step function CallAwsService Construct that checks the execution status of the Spark job
     * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
     * @returns CallAwsServiceProps
     */

  getJobMonitorTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrserverless',
      action: 'getJobRun',
      iamAction: 'emrserverless:GetJobRun',
      parameters: {
        ApplicationId: this.emrServerlessJobConfig.applicationId,
        JobRunId: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: ['*'],
      resultSelector: {
        'State.$': '$.JobRun.State',
        'StateDetails.$': '$.JobRun.StateDetails',
      },
      resultPath: '$.JobRunState',
    } as CallAwsServiceProps;
  }

  /**
     * Returns the props for the step function task that handles the failure  if the EMR Serverless job fails.
     * @returns FailProps The error details of the failed Spark Job
     */
  getJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRServerlessJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    } as FailProps;
  }


  /**
     * Returns the status of the EMR Serverless job that succeeded  based on the GetJobRun API response
     * @returns string
     */
  getJobStatusSucceed(): string {
    return 'SUCCESS';
  }

  /**
     * Returns the status of the EMR Serverless job that failed based on the GetJobRun API response
     * @returns string
     */
  getJobStatusFailed(): string {
    return 'FAILED';
  }

  /**
     * Grants the necessary permissions to the Step function StateMachine to be able to start EMR Serverless job
     * @param role Step functions StateMachine IAM role
     * @see SparkRuntimeServerless.grantJobExecution
     */

  grantExecutionRole(role: IRole): void {
    SparkRuntimeServerless.grantJobExecution(role, [this.emrServerlessJobConfig.executionRoleArn], [`arn:aws:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.emrServerlessJobConfig.applicationId}`, `arn:aws:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.emrServerlessJobConfig.applicationId}/jobruns/*`]);
  }
}

/**
   * Configuration for the EMR Serverless job.
   * @param applicationId The ID of the EMR Serverless application.
   * @param executionRoleArn The ARN of the EMR Serverless execution role.
   * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
   */

export interface EmrServerlessConfig {
  /**
     * application ID of the EMR Serverless application.
     */
  readonly applicationId: string;
  /**
     * ARN of the IAM role to use for the EMR Serverless job.
     */
  readonly executionRoleArn: string;
  /**
     * EMR Serverless Job Configuration.
     * @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
     */
  readonly jobConfig: {
    'ClientToken': string;
    'Name'?:string;
    'ConfigurationOverrides'?:{ [key:string] : any};
    'ExecutionRoleArn':string;
    'JobDriver':{ [key:string] : any};
    'ExecutionTimeoutMinutes'?:number;
    'Tags'?:{ [key:string] : any};
  };
}
