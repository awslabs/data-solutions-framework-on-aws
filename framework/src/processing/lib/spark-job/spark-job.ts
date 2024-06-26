// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, IBucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Choice, Condition, DefinitionBody, Fail, FailProps, LogLevel, StateMachine, Succeed, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJobProps } from './spark-job-props';
import { Context, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';

/**
 * A base construct to run Spark Jobs.
 *
 * Creates an AWS Step Functions State Machine that orchestrates the Spark Job.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Processing/spark-emr-serverless-job
 *
 * Available implementations:
 * * {@link SparkEmrServerlessJob} for Emr Serverless implementation
 * * {@link SparkEmrEksJob} for EMR On EKS implementation
 *
 */
export abstract class SparkJob extends TrackedConstruct {

  /**
   * The Step Functions State Machine created to orchestrate the Spark Job
   */
  public stateMachine?: StateMachine;

  /**
   * The CloudWatch Log Group used by the State Machine
   */
  public stateMachineLogGroup?: ILogGroup;

  /**
   * The S3 Bucket for the Spark job logs
   */
  protected s3LogBucket?: IBucket;

  /**
   * The loudWatch Logs Group for the Spark job logs
   */
  protected emrJobLogGroup?: ILogGroup;

  /**
   * The removal policy when deleting the CDK resource.
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
  protected abstract grantExecutionRole(role:IRole): void;

  /**
   * Creates a State Machine that orchestrates the Spark Job. This is a default implementation that can be overridden by the extending class.
   * @param jobTimeout Timeout for the state machine. @defautl 30 minutes
   * @param schedule Schedule to run the state machine. @default no schedule
   * @returns StateMachine
   */
  protected createStateMachine(jobTimeout: Duration, schedule? : Schedule): StateMachine {

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
      this.stateMachineLogGroup = new LogGroup(this, 'LogGroup', {
        removalPolicy: this.removalPolicy,
        logGroupName: `/aws/vendedlogs/states/${Utils.generateUniqueHash(this)}`,
      });

      // StepFunctions state machine
      this.stateMachine = new StateMachine(this, 'EmrPipeline', {
        definitionBody: DefinitionBody.fromChainable(emrPipelineChain),
        tracingEnabled: true,
        timeout: jobTimeout ?? Duration.minutes(30),
        logs: {
          destination: this.stateMachineLogGroup,
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
   * @param s3LogBucket The S3 Bucket to store the logs of the Spark job. @default - A new bucket is created
   * @param s3LogPrefix The prefix to store logs in the Log Bucket. @default - No prefix is used
   * @param encryptionKey The KMS Key for encryption. @default - Master KMS key of the account
   * @returns string S3 path to store the logs.
   */
  protected createS3LogBucket(s3LogBucket?:IBucket, s3LogPrefix?: string, encryptionKey?: IKey): string {

    if (!this.s3LogBucket) {
      this.s3LogBucket = s3LogBucket ?? new Bucket(this, 'SparkLogsBucket', {
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: this.removalPolicy == RemovalPolicy.DESTROY,
        encryptionKey: encryptionKey,
        encryption: encryptionKey ? BucketEncryption.KMS : BucketEncryption.KMS_MANAGED,
      });
    }

    return `s3://${this.s3LogBucket.bucketName}/${s3LogPrefix ||''}`;
  }

  /**
   * Creates an encrypted CloudWatch Logs group to store the Spark job logs.
   * @param name CloudWatch Logs group name of cloudwatch log group to store the Spark job logs
   * @param encryptionKeyArn KMS Key ARN for encryption. @default - Server-side encryption managed by CloudWatch Logs.
   * @returns LogGroup CloudWatch Logs group.
   */
  protected createCloudWatchLogsLogGroup(name:string, encryptionKeyArn?:string): ILogGroup {
    if (! this.emrJobLogGroup) {
      this.emrJobLogGroup = new LogGroup(this, 'SparkLogsCloudWatchLogGroup', {
        logGroupName: name,
        encryptionKey: encryptionKeyArn ? Key.fromKeyArn(this, 'SparkLogsCloudWatchEncryptionKey', encryptionKeyArn) : undefined,
        removalPolicy: this.removalPolicy,
      });
    }

    return this.emrJobLogGroup;
  }
}
