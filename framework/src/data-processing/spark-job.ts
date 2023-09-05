// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Choice, Condition, Fail, FailProps, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { TrackedConstruct, TrackedConstructProps } from '../utils';
import { BlockPublicAccess, Bucket, IBucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';

/**
 * A base construct to run Spark Jobs
 * Creates an AWS Step Function State Machine that orchestrates the Spark Job.
 * @see SparkJobProps parameters to be specified for the construct
 * @see EmrServerlessSparkJob for Emr Serverless implementation
 * @see EmrOnEksSparkJob for EMR On EKS implementation
 */
export abstract class SparkJob extends TrackedConstruct {

  /**
   * Interface for EMR Cluster implementation. Can be either EmrOnEksTask or EmrServerlessTask
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
   * Constructs a new instance of the SparkJob class.
   * @param scope the Scope of the CDK Construct.
   * @param id the ID of the CDK Construct.
   * @param props the SparkJobProps properties.
   */
  constructor(scope: Construct, id: string, trackingTag: string) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: trackingTag,
    };

    super(scope, id, trackedConstructProps);
  }

  /**
   * Parameters for step functions task that runs the Spark job
   * @returns CallAwsServiceProps
   */
  protected abstract getJobStartTaskProps(): CallAwsServiceProps;

    this.emrTaskImplementation = this.sparkJobProps.EmrOnEksJobConfig?.virtualClusterId ?
      new EmrOnEksTask(this.sparkJobProps.EmrOnEksJobConfig!, scope) :
      new EmrServerlessTask(this.sparkJobProps.EmrServerlessJobConfig!);

  /**
   * Parameters for step functions task that fails the Spark job
   * @returns FailProps
   */
  protected abstract getJobFailTaskProps(): FailProps;

  /**
   * Returns the status of the Spark job that succeeded  based on the GetJobRun API response
   * @returns string
   */
  protected abstract getJobStatusSucceed(): string;

  /**
   * Returns the status of the Spark job that failed based on the GetJobRun API response
   * @returns string
   */
  protected abstract getJobStatusFailed(): string;

  /**
   * Returns the Spark Job Execution Role
   * @param role
   */
  protected abstract getSparkJobExecutionRole(): IRole;


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

    // StepFunctions state machine
    const stateMachine: StateMachine = new StateMachine(this, 'EmrPipeline', {
      definition: emrPipelineChain,
      timeout: Duration.seconds(1800),
    },
    );

    this.grantExecutionRole(stateMachine.role);
    if (schedule) {
      new Rule(this, 'SparkJobPipelineTrigger', {
        schedule: schedule,
        targets: [new SfnStateMachine(stateMachine)],
      });
    }
    return stateMachine;
  }

  protected createS3LogBucket(s3LogUri?:string, encryptionKeyArn?:string): string {
    if (! this.s3LogBucket) {
      this.s3LogBucket = s3LogUri ? Bucket.fromBucketName(this, 'S3LogBucket', s3LogUri.match(/s3:\/\/([^\/]+)/)![1]) : new Bucket(this, 'S3LogBucket', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: RemovalPolicy.DESTROY,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'EncryptionKey', encryptionKeyArn) : undefined,
        encryption: encryptionKeyArn ? BucketEncryption.KMS : BucketEncryption.KMS_MANAGED,
      });
    } 

    return `s3://${this.s3LogBucket.bucketName}/`;
  }

  protected createCloudWatchLogsLogGroup(name:string, encryptionKeyArn?:string): LogGroup {
    if (! this.cloudwatchGroup) {
      this.cloudwatchGroup = new LogGroup(this, 'CloudWatchLogsLogGroup', {
        logGroupName : name,
        retention: RetentionDays.ONE_MONTH,
        encryptionKey : encryptionKeyArn ? Key.fromKeyArn(this, 'EncryptionKey', encryptionKeyArn) : undefined,
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
   * Schedule to run the step function.
   * @see Schedule @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]
   */
  readonly schedule?: Schedule;
}
