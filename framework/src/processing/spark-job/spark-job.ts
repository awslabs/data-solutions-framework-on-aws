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
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket
   * If DESTROY is selected, the context value '@aws-data-solutions-framework/removeDataOnDestroy'
   * in the 'cdk.json' or 'cdk.context.json' must be set to true
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  private removalPolicy: RemovalPolicy;


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
    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
  }

  /**
   * Parameters for Step Functions task that runs the Spark job
   * @returns CallAwsServiceProps
   */
  protected abstract returnJobStartTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for Step Functions task that monitors the Spark job
   * @returns CallAwsServiceProps
   */
  protected abstract returnJobMonitorTaskProps(): CallAwsServiceProps;

  /**
   * Parameters for Step Functions task that fails the Spark job
   * @returns FailProps
   */
  protected abstract returnJobFailTaskProps(): FailProps;

  /**
   * Returns the status of the Spark job that succeeded based on the GetJobRun API response
   * @returns string
   */
  protected abstract returnJobStatusSucceed(): string;

  /**
   * Returns the status of the Spark job that failed based on the GetJobRun API response
   * @returns string
   */
  protected abstract returnJobStatusFailed(): string;

  /**
   * Returns the status of the Spark job that is cancelled based on the GetJobRun API response
   */
  protected abstract returnJobStatusCancelled(): string;

  // /**
  //  * Returns the Spark Job Execution Role
  //  * @param scope the Scope of the CDK Construct.
  //  * @returns IRole
  //  */
  // protected abstract returnSparkJobExecutionRole(scope:Construct): IRole;


  /**
   * Grants the execution role to the Step Functions state machine
   * @param role
   */
  protected abstract grantExecutionRole(role:IRole):void;

  /**
   * Creates a State Machine that orchestrates the Spark Job. This is a default implementation that can be overridden by the extending class.
   * @param jobTimeout Timeout for the state machine. @defautl 30 minutes
   * @param schedule Schedule to run the state machine. @default no schedule
   * @returns StateMachine
   */
  protected createStateMachine(jobTimeout?: Duration, schedule? : Schedule): StateMachine {

    if (!this.stateMachine) {

      const emrStartJobTask = new CallAwsService(this, 'EmrStartJobTask', this.returnJobStartTaskProps());

      const emrMonitorJobTask = new CallAwsService(this, 'EmrMonitorJobTask', this.returnJobMonitorTaskProps());

      const wait = new Wait(this, 'Wait', {
        time: WaitTime.duration(Duration.seconds(60)),
      });

      const jobFailed = new Fail(this, 'JobFailed', this.returnJobFailTaskProps());

      const jobSucceeded = new Succeed(this, 'JobSucceeded');

      const emrPipelineChain = emrStartJobTask.next(wait).next(emrMonitorJobTask).next(
        new Choice(this, 'JobSucceededOrFailed')
          .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusSucceed()), jobSucceeded)
          .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusFailed()), jobFailed)
          .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusCancelled()), jobFailed)
          .otherwise(wait),
      );

      // Enable CloudWatch Logs for the state machine
      const logGroup = new LogGroup(this, 'LogGroup', {
        removalPolicy: this.removalPolicy,
      });

      // StepFunctions state machine
      this.stateMachine = new StateMachine(this, 'EmrPipeline', {
        definition: emrPipelineChain,
        tracingEnabled: true,
        timeout: jobTimeout ?? Duration.minutes(30),
        logs: {
          destination: logGroup,
          level: LogLevel.ALL,
        },
      });

      this.grantExecutionRole(this.stateMachine.role);
      if (schedule) {
        new Rule(this, 'SparkJobPipelineTrigger', {
          schedule: schedule,
          targets: [new SfnStateMachine(this.stateMachine)],
        });
      }
    }

    return this.stateMachine;
  }

  /**
   * Creates or import an S3 bucket to store the logs of the Spark job.
   * The bucket is created with SSE encryption (KMS managed or provided by user).
   * @param s3LogUri S3 path to store the logs of the Spark job. @example s3://<bucket-name>/
   * @param encryptionKeyArn KMS Key ARN for encryption. @default - Master KMS key of the account.
   * @returns string S3 path to store the logs.
   */
  protected createS3LogBucket(s3LogUri?:string, encryptionKeyArn?:string): string {

    if (! this.s3LogBucket) {
      this.s3LogBucket = s3LogUri ? Bucket.fromBucketName(this, 'SparkLogsBucket', s3LogUri.match(/s3:\/\/([^\/]+)/)![1]) : new Bucket(this, 'SparkLogsBucket', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: this.removalPolicy == RemovalPolicy.DESTROY,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'SparkLogsBucketEncryptionKey', encryptionKeyArn) : undefined,
        encryption: encryptionKeyArn ? BucketEncryption.KMS : BucketEncryption.KMS_MANAGED,
      });
    }

    return s3LogUri ? s3LogUri : `s3://${this.s3LogBucket.bucketName}/`;
  }

  /**
   * Creates an encrypted CloudWatch Logs group to store the Spark job logs.
   * @param name CloudWatch Logs group name of cloudwatch log group to store the Spark job logs
   * @param encryptionKeyArn KMS Key ARN for encryption. @default - Server-side encryption managed by CloudWatch Logs.
   * @returns LogGroup CloudWatch Logs group.
   */
  protected createCloudWatchLogsLogGroup(name:string, encryptionKeyArn?:string): LogGroup {
    if (! this.cloudwatchGroup) {
      this.cloudwatchGroup = new LogGroup(this, 'SparkLogsCloudWatchLogGroup', {
        logGroupName: name,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'SparkLogsCloudWatchEncryptionKey', encryptionKeyArn) : undefined,
        removalPolicy: this.removalPolicy,
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
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@aws-data-solutions-framework/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * Schedule to run the Step Functions state machine.
   * @see Schedule @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]
   */
  readonly schedule?: Schedule;
}