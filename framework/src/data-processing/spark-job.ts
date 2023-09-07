// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Choice, Condition, Fail, FailProps, LogLevel, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

/**
 * A base construct to run Spark Jobs
 * Creates an AWS Step Functions State Machine that orchestrates the Spark Job.
 * @see SparkJobProps parameters to be specified for the construct
 * @see EmrServerlessSparkJob for Emr Serverless implementation
 * @see EmrOnEksSparkJob for EMR On EKS implementation
 */
export abstract class SparkJob extends Construct {

  /**
   * Tag resources with this key and value to identify the owner of the resources.
   */
  static OWNER_TAG: {key: string; value: string} = {
    key: 'adsf-owned',
    value: 'true',
  };

  /**
   * Step Functions StateMachine created to orchestrate the Spark Job
   */
  public stateMachine: undefined | StateMachine;

  /**
   * Constructs a new instance of the SparkJob class.
   * @param scope the Scope of the CDK Construct.
   * @param id the ID of the CDK Construct.
   * @param props the SparkJobProps properties.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  /**
   * Parameters for Step Functions task that runs the Spark job
   * @returns CallAwsServiceProps
   */
  protected abstract getJobStartTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for Step Functions task that monitors the Spark job
   * @returns CallAwsServiceProps
   */
  protected abstract getJobMonitorTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for Step Functions task that fails the Spark job
   * @returns FailProps
   */
  protected abstract getJobFailTaskProps(): FailProps;

  /**
   * Returns the status of the Spark job that succeeded based on the GetJobRun API response
   * @returns string
   */
  protected abstract getJobStatusSucceed(): string;

  /**
   * Returns the status of the Spark job that failed based on the GetJobRun API response
   * @returns string
   */
  protected abstract getJobStatusFailed(): string;

  /**
   * Grants the execution role to the Step Functions state machine
   * @param role
   */
  protected abstract grantExecutionRole(role:IRole):void;

  /**
   * Creates a State Machine that orchestrates the Spark Job. This is a default implementation that can be overridden by the extending class.
   * @param schedule Schedule to run the state machine.
   * @returns StateMachine
   */
  protected createStateMachine(schedule? : Schedule): StateMachine {

    const emrStartJobTask = new CallAwsService(this, 'EmrStartJobTask', this.getJobStartTaskProps());

    const emrMonitorJobTask = new CallAwsService(this, 'EmrMonitorJobTask', this.getJobMonitorTaskProps());

    const wait = new Wait(this, 'Wait', {
      time: WaitTime.duration(Duration.seconds(60)),
    });

    const jobFailed = new Fail(this, 'JobFailed', this.getJobFailTaskProps());

    const jobSucceeded = new Succeed(this, 'JobSucceeded');

    const emrPipelineChain = emrStartJobTask.next(wait).next(emrMonitorJobTask).next(
      new Choice(this, 'JobSucceededOrFailed')
        .when(Condition.stringEquals('$.JobRunState.State', this.getJobStatusSucceed()), jobSucceeded)
        .when(Condition.stringEquals('$.JobRunState.State', this.getJobStatusFailed()), jobFailed)
        .otherwise(wait),
    );

    // Enable CloudWatch Logs for the state machine
    const logGroup = new LogGroup(this, 'LogGroup', {
      retention: RetentionDays.ONE_MONTH,
    });

    // StepFunctions state machine
    const stateMachine: StateMachine = new StateMachine(this, 'EmrPipeline', {
      definition: emrPipelineChain,
      tracingEnabled: true,
      timeout: Duration.seconds(1800),
      logs: {
        destination: logGroup,
        level: LogLevel.ALL,
      },
    });

    this.grantExecutionRole(stateMachine.role);
    if (schedule) {
      new Rule(this, 'SparkJobPipelineTrigger', {
        schedule: schedule,
        targets: [new SfnStateMachine(stateMachine)],
      });
    }
    return stateMachine;
  }
}


/**
 * Properties for the SparkJob construct.
 */
export interface SparkJobProps {

  /**
   * Schedule to run the Step Functions state machine.
   * @see Schedule @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]
   */
  readonly schedule?: Schedule;
}

