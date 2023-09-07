// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob, SparkJobProps } from './spark-job';
import { EmrVersion } from '../utils';


/**
 * A construct to run Spark Jobs using EMR on EKS.
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
 *          jobConfig:{
 *               "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
 *               "VirtualClusterId": "virtualClusterId",
 *               "ExecutionRoleArn": myExecutionRole.roleArn,
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
export class EmrOnEksSparkJob extends SparkJob {
  readonly config: EmrOnEksSparkJobProps;

  constructor( scope: Construct, id: string, props: EmrOnEksSparkJobProps) {
    super(scope, id);

    //Set defaults
    props.jobConfig.ClientToken ??= JsonPath.uuid();
    props.jobConfig.ExecutionTimeoutMinutes ??= 30;
    props.jobConfig.ReleaseLabel ??= EmrVersion.V6_2;


    this.config = props;
    this.stateMachine = this.createStateMachine(this.config.schedule);
  }


  /**
   * Returns the props for the Step Functions CallAwsService Construct that starts the Spark job
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  getJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'StartJobRun',
      iamAction: 'emr-containers:StartJobRun',
      parameters: this.config.jobConfig,
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}`],
      resultSelector: {
        'JobRunId.$': '$.Id',
      },
    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the Step Functions CallAwsService Construct that checks the execution status of the Spark job
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  getJobMonitorTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'describeJobRun',
      iamAction: 'emr-container:DescribeJobRun',
      parameters: {
        VirtualClusterId: this.config.jobConfig.VirtualClusterId,
        Id: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}/jobruns/*`],
      resultSelector: {
        'State.$': '$.State',
        'StateDetails.$': '$.StateDetails',
      },
      resultPath: '$.JobRunState',


    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the Step Functions task that handles the failure  if the EMR Serverless job fails.
   * @returns FailProps The error details of the failed Spark Job
   */

  getJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRonEKSJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    };
  }

  /**
   * Returns the status of the EMR on EKS job that succeeded  based on the GetJobRun API response
   * @returns string
   */

  getJobStatusSucceed(): string {
    return 'COMPLETED';
  }

  /**
   * Returns the status of the EMR on EKS job that failed based on the GetJobRun API response
   * @returns string
   */

  getJobStatusFailed(): string {
    return 'FAILED';
  }

  /**
   * Grants the necessary permissions to the Step Functions StateMachine to be able to start EMR on EKS job
   * @param role Step Functions StateMachine IAM role
   */

  grantExecutionRole(role: IRole): void {
    role.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-containers:StartJobRun',
        'emr-containers:DescribeJobRun',
      ],
      resources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}`, `arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}/jobruns/*`],
      conditions: {
        StringEquals: {
          'emr-containers:ExecutionRoleArn': this.config.jobConfig.ExecutionRoleArn,
        },
      },
    }));
  }
}


/**
 * Configuration for the EMR on EKS job.
 * @param virtualClusterId The ID of the EMR on EKS cluster.
 * @param executionRoleArn The ARN of the EMR on EKS job execution role.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface EmrOnEksSparkJobProps extends SparkJobProps {

  /**
   * EMR on EKS Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {
    'VirtualClusterId': string;
    'ClientToken'?: string;
    'Name'?:string;
    'ConfigurationOverrides'?:{ [key:string] : any};
    'ExecutionRoleArn':string;
    'JobDriver':{ [key:string] : any};
    'ExecutionTimeoutMinutes'?:number;
    'JobTemplateId'?:string;
    'JobTemplateParameters'?:{ [key:string] : string};
    'ReleaseLabel'?:EmrVersion;
    'Tags'?:{ [key:string] : any};
  };
}