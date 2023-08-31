// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Choice, Condition, Fail, FailProps, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { EmrOnEksConfig, EmrOnEksTask } from './spark-job-emroneks';
import { EmrServerlessConfig, EmrServerlessTask } from './spark-job-emrserverless';

/**
 * A construct to run Spark Jobs using EMR Serverless or EMR On EKS.
 * creates a State Machine that orchestrates the Spark Job.
 * @see SparkJobProps parameters to be specified for the construct
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
 * EmrServerlessJobConfig:{applicationId:applicationId,executionRoleArn:myExecutionRole.roleArn,jobConfig:{
 *   "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
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
 *
 * }}
 * } as SparkJobProps);
 *
 * new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
 *   value: job.stateMachine.stateMachineArn,
 * });
 * ```
 */

export class SparkJob extends Construct {

  /**
   * Properties for the SparkJob construct.
   */
  private sparkJobProps: SparkJobProps;

  /**
   * Interface for EMR Cluster implementation. Can be either EmrOnEksTask or EmrServerlessTask
   */

  private emrTaskImplementation: EmrClusterTaskImplementation;

  /**
   * Step Function StateMachine created to orchestrate the Spark Job
   */
  public readonly stateMachine: StateMachine;

  /**
   * Constructs a new instance of the SparkJob class.
   * @param scope the Scope of the CDK Construct.
   * @param id the ID of the CDK Construct.
   * @param props the SparkJobProps properties.
   */

  constructor(scope: Construct, id: string, props: SparkJobProps) {
    super(scope, id);
    this.sparkJobProps = props;

    if (!this.sparkJobProps.EmrOnEksJobConfig && !this.sparkJobProps.EmrServerlessJobConfig) {
      throw new Error('Either EmrOnEksJobConfig or EmrServerlessJobConfig must be provided');
    }

    this.emrTaskImplementation = this.sparkJobProps.EmrOnEksJobConfig?.virtualClusterId ?
      new EmrOnEksTask(this.sparkJobProps.EmrOnEksJobConfig!, scope) :
      new EmrServerlessTask(this.sparkJobProps.EmrServerlessJobConfig!);


    const emrStartJobTask = new CallAwsService(this, 'EmrStartJobTask', this.emrTaskImplementation.getJobStartTaskProps());

    const emrMonitorJobTask = new CallAwsService(this, 'EmrMonitorJobTask', this.emrTaskImplementation.getJobMonitorTaskProps());

    const wait = new Wait(this, 'Wait', {
      time: WaitTime.duration(Duration.seconds(60)),
    });

    const jobFailed = new Fail(this, 'JobFailed', this.emrTaskImplementation.getJobFailTaskProps());

    const jobSucceeded = new Succeed(this, 'JobSucceeded');

    const emrPipelineChain = emrStartJobTask.next(wait).next(emrMonitorJobTask).next(
      new Choice(this, 'JobSucceededOrFailed')
        .when(Condition.stringEquals('$.JobRunState.State', this.emrTaskImplementation.getJobStatusSucceed()), jobSucceeded)
        .when(Condition.stringEquals('$.JobRunState.State', this.emrTaskImplementation.getJobStatusFailed()), jobFailed)
        .otherwise(wait),
    );

    // StepFunctions state machine
    this.stateMachine = new StateMachine(this, 'EmrPipeline', {
      definition: emrPipelineChain,
      timeout: Duration.seconds(1800),
    },
    );

    this.emrTaskImplementation.grantExecutionRole(this.stateMachine.role);

    if (this.sparkJobProps.schedule) {
      new Rule(this, 'EmrPipelineTrigger', {
        schedule: this.sparkJobProps.schedule,
        targets: [new SfnStateMachine(this.stateMachine)],
      });
    }
  }


}


/**
 * Properties for the SparkJob construct.
 */
export interface SparkJobProps {

  /**
   * Spark Job Config for EmkOnEks cluster
   */
  readonly EmrOnEksJobConfig?: EmrOnEksConfig;

  /**
   * Spark Job Config for EMR Serverless cluster
   */
  readonly EmrServerlessJobConfig?: EmrServerlessConfig;

  /**
   * Schedule to run the step function.
   * @see Schedule @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]
   */
  readonly schedule?: Schedule;

}


/**
 * Defines interface for EMR Cluster Task implementation.
 * @see EmrOnEksTask class for the actual implementation of the interface based on EmrOnEks cluster
 * @see EmrServerlessTask class for the actual implementation of the interface based on EMR Serlverless cluster
 */
export interface EmrClusterTaskImplementation {
  /**
   * Sets the config for the Spark job to be run using EMR Serverless or EmrOnEks
   * @param config
   */
  setConfig( config: EmrOnEksConfig | EmrServerlessConfig): void;

  /**
   * Parameters for step functions task that runs the Spark job
   * @returns CallAwsServiceProps
   */
  getJobStartTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for step functions task that monitors the Spark job
   * @returns CallAwsServiceProps
   */
  getJobMonitorTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for step functions task that fails the Spark job
   * @returns FailProps
   */
  getJobFailTaskProps(): FailProps;

  /**
   * Returns the status of the Spark job that succeeded  based on the GetJobRun API response
   * @returns string
   */
  getJobStatusSucceed(): string;

  /**
   * Returns the status of the Spark job that failed  based on the GetJobRun API response
   * @returns string
   */
  getJobStatusFailed(): string;

  /**
   * Grants the execution role to the step function state machine
   * @param role
   */
  grantExecutionRole(role:IRole):void;
}
