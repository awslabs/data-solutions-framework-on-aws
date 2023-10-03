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

  /**
   * Returns the Spark Job Execution Role
   * @param scope the Scope of the CDK Construct.
   * @returns IRole
   */
  protected abstract returnSparkJobExecutionRole(scope:Construct): IRole;


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

    const emrStartJobTask = new CallAwsService(scope, `EmrStartJobTask-${id}`, this.returnJobStartTaskProps());

    const emrMonitorJobTask = new CallAwsService(scope, `EmrMonitorJobTask-${id}`, this.returnJobMonitorTaskProps());

    const wait = new Wait(scope, `Wait-${id}`, {
      time: WaitTime.duration(Duration.seconds(60)),
    });

    const jobFailed = new Fail(scope, `JobFailed-${id}`, this.returnJobFailTaskProps());

    const jobSucceeded = new Succeed(scope, `JobSucceeded-${id}`);

    const emrPipelineChain = emrStartJobTask.next(wait).next(emrMonitorJobTask).next(
      new Choice(scope, `JobSucceededOrFailed-${id}`)
        .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusSucceed()), jobSucceeded)
        .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusFailed()), jobFailed)
        .when(Condition.stringEquals('$.JobRunState.State', this.returnJobStatusCancelled()), jobFailed)
        .otherwise(wait),
    );

    // Enable CloudWatch Logs for the state machine
    const logGroup = new LogGroup(scope, `LogGroup-${id}`, {
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
   * @param s3LogUri S3 path to store the logs of the Spark job. @example s3://<bucket-name>/
   * @param encryptionKeyArn KMS Key ARN for encryption. @default - Master KMS key of the account.
   * @returns string S3 path to store the logs.
   */
  protected createS3LogBucket(scope:Construct, s3LogUri?:string, encryptionKeyArn?:string): string {

    if (! this.s3LogBucket) {
      this.s3LogBucket = s3LogUri ? Bucket.fromBucketName(scope, 'S3LogBucket', s3LogUri.match(/s3:\/\/([^\/]+)/)![1]) : new Bucket(scope, 'S3LogBucket', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: this.resourceRemovalPolicy,
        autoDeleteObjects: this.resourceRemovalPolicy == RemovalPolicy.DESTROY,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'EncryptionKey', encryptionKeyArn) : undefined,
        encryption: encryptionKeyArn ? BucketEncryption.KMS : BucketEncryption.KMS_MANAGED,
      });
    }

    return s3LogUri ? s3LogUri : `s3://${this.s3LogBucket.bucketName}/`;
  }

  /**
   *
   * @param scope Construct
   * @param name CloudWatch Logs group name of cloudwatch log group to store the Spark job logs
   * @param encryptionKeyArn KMS Key ARN for encryption. @default - Server-side encryption managed by CloudWatch Logs.
   * @returns LogGroup CloudWatch Logs group.
   */
  protected createCloudWatchLogsLogGroup(scope:Construct, name:string, encryptionKeyArn?:string): LogGroup {
    if (! this.cloudwatchGroup) {
      this.cloudwatchGroup = new LogGroup(scope, `CloudWatchLogsLogGroup-${name}`, {
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