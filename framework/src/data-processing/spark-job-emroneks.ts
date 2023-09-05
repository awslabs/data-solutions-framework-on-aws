// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { EmrClusterTaskImplementation } from './spark-job';


/**
 * A construct to run Spark Jobs using EMRonEKS.
 * creates a State Machine that orchestrates the Spark Job.
 * @see EmrOnEksSparkJobProps parameters to be specified for the construct
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

export class EmrOnEksTask implements EmrClusterTaskImplementation {
  private emrOnEksJobConfig!: EmrOnEksConfig;
  private scope : Construct;

  constructor(emrOnEksJobConfig: EmrOnEksConfig, scope : Construct) {
    this.setConfig(emrOnEksJobConfig);
    this.scope = scope;
  }


  /**
   * Returns the props for the step function CallAwsService Construct that starts the Spark job
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  getJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'StartJobRun',
      iamAction: 'emr-containers:StartJobRun',
      parameters: this.config.jobConfig,
      iamResources: ['*'],
      resultSelector: {
        'JobRunId.$': '$.Id',
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
      service: 'emrcontainers',
      action: 'describeJobRun',
      iamAction: 'emr-container:DescribeJobRun',
      parameters: {
        VirtualClusterId: this.config.virtualClusterId,
        Id: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: ['*'],
      resultSelector: {
        'State.$': '$.State',
        'StateDetails.$': '$.StateDetails',
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
      cause: 'EMRonEKSJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    };
  }

  /**
   * Returns the status of the EMR Serverless job that succeeded  based on the GetJobRun API response
   * @returns string
   */

  getJobStatusSucceed(): string {
    return 'COMPLETED';
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
   */

  grantExecutionRole(role: IRole): void {
    role.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-containers:StartJobRun',
        'emr-containers:DescribeJobRun',
      ],
      resources: [`arn:aws:emr-containers:${Stack.of(this.scope).region}:${Stack.of(this.scope).account}:/virtualclusters/${this.emrOnEksJobConfig.virtualClusterId}`],
      conditions: {
        StringEquals: {
          'emr-containers:ExecutionRoleArn': this.config.executionRoleArn,
        },
      },
    }));
  }
}


/**
 * Configuration for the EMRonEKS job.
 * @param virtualClusterId The ID of the EMRonEKS cluster.
 * @param executionRoleArn The ARN of the EMRonEKS job execution role.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface EmrOnEksSparkJobProps extends SparkJobProps {

  /**
   * EmrOnEks Virtual Cluster ID.
   */
  readonly virtualClusterId: string;

  /**
   * ARN of the IAM role to use for the EMRonEks job.
   */
  readonly executionRoleArn: string;

  /**
   * EMRonEKS Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {
    'ClientToken': string;
    'Name'?:string;
    'ConfigurationOverrides'?:{ [key:string] : any};
    'ExecutionRoleArn':string;
    'JobDriver':{ [key:string] : any};
    'ExecutionTimeoutMinutes'?:number;
    'JobTemplateId'?:string;
    'JobTemplateParameters'?:{ [key:string] : string};
    'ReleaseLabel':string;
    'Tags'?:{ [key:string] : any};
  };
}