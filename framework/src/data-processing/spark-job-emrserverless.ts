// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob, SparkJobProps } from './spark-job';
import { SparkRuntimeServerless } from '../processing-runtime/spark-runtime-serverless';

/**
 * A construct to run Spark Jobs using EMR Serverless.
 * creates a State Machine that orchestrates the Spark Job.
 * @see EmrServerlessSparkJobProps parameters to be specified for the construct
 *
 * **Usage example**
 * @example
 * ```typescript
 *
 * const myFileSystemPolicy = new PolicyDocument({
 *   statements: [new PolicyStatement({
 *     actions: [
 *       's3:GetObject',
 *     ],
 *     resources: ['*'],
 *   })],
 * });
 *
 *
 * const myExecutionRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);
 * const applicationId = "APPLICATION_ID";
 * const job = new SparkJob(stack, 'SparkJob', {
 *    applicationId:applicationId,executionRoleArn:myExecutionRole.roleArn,jobConfig:{
 *               "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
 *               "ApplicationId": applicationId,
 *               "ClientToken": JsonPath.uuid(),
 *               "ExecutionRoleArn": myExecutionRole.roleArn,
 *               "ExecutionTimeoutMinutes": 30,
 *               "JobDriver": {
 *                   "SparkSubmit": {
 *                       "EntryPoint": "s3://S3-BUCKET/pi.py",
 *                       "EntryPointArguments": [],
 *                       "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
 *                   },
 *               }
 *          }
 * } as EmrServerlessSparkJobProps);
 *
 * new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
 *   value: job.stateMachine.stateMachineArn,
 * });
 * ```
 */

export class EmrServerlessSparkJob extends SparkJob {
  private config: EmrServerlessSparkJobProps;

  constructor( scope: Construct, id: string, props: EmrServerlessSparkJobProps) {
    super(scope, id);
    this.config = props;
    if (!this.config.jobConfig.Tags) {
      this.config.jobConfig.Tags = {};
    }
    this.config.jobConfig.Tags[SparkJob.OWNER_TAG.key] = SparkJob.OWNER_TAG.value;
    this.stateMachine = this.createStateMachine(this.config.schedule);
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
      parameters: this.config.jobConfig,
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
        ApplicationId: this.config.applicationId,
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

export interface EmrServerlessSparkJobProps extends SparkJobProps {
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
