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

    if (!this.sparkJobProps.EmrOnEksJobConfig && !this.sparkJobProps.EmrServerlessJobConfig) {
      throw new Error('Either EmrOnEksJobConfig or EmrServerlessJobConfig must be provided');
    }

    this.emrTaskImplementation = this.sparkJobProps.EmrOnEksJobConfig?.virtualClusterId ?
      new EmrOnEksTask(this.sparkJobProps.EmrOnEksJobConfig!, scope) :
      new EmrServerlessTask(this.sparkJobProps.EmrServerlessJobConfig!);


    const emrStartJobTask = new CallAwsService(this, 'EmrStartJobTask', this.emrTaskImplementation.getJobStartTaskProps());

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
