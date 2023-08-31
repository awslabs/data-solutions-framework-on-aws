// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { EmrClusterTaskImplementation } from './spark-job';


/**
 * Class that provides specific implementation for EMRonEks cluster
 * @implements EmrClusterTaskImplementation
 */

export class EmrOnEksTask implements EmrClusterTaskImplementation {
  private emrOnEksJobConfig!: EmrOnEksConfig;
  private scope : Construct;

  constructor(emrOnEksJobConfig: EmrOnEksConfig, scope : Construct) {
    this.setConfig(emrOnEksJobConfig);
    this.scope = scope;
  }

  /**
     * Sets the config for the Spark job to be run using EMR on EKS.
     * Job run will be tagged with adsf-owned=true.
     * @param config EmrOnEks Job  config
     */
  setConfig(config: EmrOnEksConfig) {
    if (!config.jobConfig.Tags) {
      config.jobConfig.Tags = {};
    }
    config.jobConfig.Tags['adsf-owned'] = 'true';
    this.emrOnEksJobConfig = config;
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
      parameters: this.emrOnEksJobConfig.jobConfig,
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
        VirtualClusterId: this.emrOnEksJobConfig.virtualClusterId,
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
          'emr-containers:ExecutionRoleArn': this.emrOnEksJobConfig.executionRoleArn,
        },
      },
    }));
  }
}

export interface EmrOnEksConfig {
  readonly virtualClusterId: string;
  readonly executionRoleArn: string;
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