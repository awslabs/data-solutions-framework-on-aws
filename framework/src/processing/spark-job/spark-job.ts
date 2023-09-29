// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, IBucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Choice, Condition, Fail, FailProps, LogLevel, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../utils';

/**
 * A base construct to run Spark Jobs
 * Creates an AWS Step Functions State Machine that orchestrates the Spark Job.
 * @see SparkJobProps parameters to be specified for the construct
 * @see EmrServerlessSparkJob for Emr Serverless implementation
 * @see EmrOnEksSparkJob for EMR On EKS implementation
 */
export abstract class SparkJob extends TrackedConstruct {

  /**
   * Step Functions StateMachine created to orchestrate the Spark Job
   */
  public stateMachine?: StateMachine;

  /**
   * S3 log bucket for the Spark job logs
   */
  protected s3LogBucket?: IBucket;

  /**
   * CloudWatch Logs Group for the Spark job logs
   */
  protected cloudwatchGroup?: LogGroup;


  /**
   * resourceRemovalPolicy
   */

  private resourceRemovalPolicy: RemovalPolicy;


  /**
   * Constructs a new instance of the SparkJob class.
   * @param scope the Scope of the CDK Construct.
   * @param id the ID of the CDK Construct.
   * @param props the SparkJobProps properties.
   */
  constructor(scope: Construct, id: string, trackingTag: string, props: SparkJobProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: trackingTag,
    };

    super(scope, id, trackedConstructProps);
    this.resourceRemovalPolicy = Context.revertRemovalPolicy(scope, props.resourceRemovalPolicy);
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
   * Returns the status of the Spark job that is cancelled based on the GetJobRun API response
   */
  protected abstract getJobStatusCancelled(): string;

  /**
   * Returns the Spark Job Execution Role
   * @param scope the Scope of the CDK Construct.
   * @returns IRole
   */
  protected abstract getSparkJobExecutionRole(scope:Construct): IRole;


  /**
   * Grants the execution role to the Step Functions state machine
   * @param role
   */
  protected abstract grantExecutionRole(role:IRole):void;

  /**
   * Creates a State Machine that orchestrates the Spark Job. This is a default implementation that can be overridden by the extending class.
   * @param scope scope of the CDK Construct.
   * @param id ID of the CDK Construct.
   * @param jobTimeout Timeout for the state machine. @defautl 30 minutes
   * @param schedule Schedule to run the state machine. @default no schedule
   * @returns StateMachine
   */
  protected createStateMachine(scope: Construct, id: string, jobTimeout?: Duration, schedule? : Schedule): StateMachine {

    const emrStartJobTask = new CallAwsService(scope, `EmrStartJobTask-${id}`, this.getJobStartTaskProps());

    const emrMonitorJobTask = new CallAwsService(scope, `EmrMonitorJobTask-${id}`, this.getJobMonitorTaskProps());

    const wait = new Wait(scope, `Wait-${id}`, {
      time: WaitTime.duration(Duration.seconds(60)),
    });

    const jobFailed = new Fail(scope, `JobFailed-${id}`, this.getJobFailTaskProps());

    const jobSucceeded = new Succeed(scope, `JobSucceeded-${id}`);

    const emrPipelineChain = emrStartJobTask.next(wait).next(emrMonitorJobTask).next(
      new Choice(scope, `JobSucceededOrFailed-${id}`)
        .when(Condition.stringEquals('$.JobRunState.State', this.getJobStatusSucceed()), jobSucceeded)
        .when(Condition.stringEquals('$.JobRunState.State', this.getJobStatusFailed()), jobFailed)
        .when(Condition.stringEquals('$.JobRunState.State', this.getJobStatusCancelled()), jobFailed)
        .otherwise(wait),
    );

    // Enable CloudWatch Logs for the state machine
    const logGroup = new LogGroup(scope, 'LogGroup', {
      removalPolicy: this.resourceRemovalPolicy,
    });

    // StepFunctions state machine
    const stateMachine: StateMachine = new StateMachine(scope, `EmrPipeline-${id}`, {
      definition: emrPipelineChain,
      tracingEnabled: true,
      timeout: jobTimeout ?? Duration.minutes(30),
      logs: {
        destination: logGroup,
        level: LogLevel.ALL,
      },
    });

    this.grantExecutionRole(stateMachine.role);
    if (schedule) {
      new Rule(scope, `SparkJobPipelineTrigger-${id}`, {
        schedule: schedule,
        targets: [new SfnStateMachine(stateMachine)],
      });
    }
    return stateMachine;
  }

  /**
   *
   * @param scope Construct
   * @param s3LogUri S3 path to store the logs. @example s3://<bucket-name>/
   * @param encryptionKeyArn KMS Key ARN for encryption. @default MAster KMS key for the account.
   * @returns string S3 path to store the logs.
   */
  protected createS3LogBucket(scope:Construct, s3LogUri?:string, encryptionKeyArn?:string): string {

    if (! this.s3LogBucket) {
      this.s3LogBucket = s3LogUri ? Bucket.fromBucketName(scope, 'S3LogBucket', s3LogUri.match(/s3:\/\/([^\/]+)/)![1]) : new Bucket(scope, 'S3LogBucket', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: this.resourceRemovalPolicy,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'EncryptionKey', encryptionKeyArn) : undefined,
        encryption: encryptionKeyArn ? BucketEncryption.KMS : BucketEncryption.KMS_MANAGED,
      });
    }

    return s3LogUri ? s3LogUri : `s3://${this.s3LogBucket.bucketName}/`;
  }

  /**
   *
   * @param scope Construct
   * @param name CloudWatch Logs group name.
   * @param encryptionKeyArn KMS Key ARN for encryption. @default no key.
   * @returns LogGroup CloudWatch Logs group.
   */
  protected createCloudWatchLogsLogGroup(scope:Construct, name:string, encryptionKeyArn?:string): LogGroup {
    if (! this.cloudwatchGroup) {
      this.cloudwatchGroup = new LogGroup(scope, 'CloudWatchLogsLogGroup', {
        logGroupName: name,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'EncryptionKey', encryptionKeyArn) : undefined,
        removalPolicy: this.resourceRemovalPolicy,
      });
    }

    return this.cloudwatchGroup;
  }

}


/**
 * Properties for the SparkJob construct.
 */
export interface SparkJobProps {

  /**
   * Resource Removal Policy. @default - global removal policy @see Context.removalPolicy
   */
  readonly resourceRemovalPolicy?: RemovalPolicy;

  /**
   * Schedule to run the Step Functions state machine.
   * @see Schedule @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]
   */
  readonly schedule?: Schedule;
}