// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, Duration } from 'aws-cdk-lib';
import { PolicyStatement, Role, IRole } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob } from './spark-job';
import { SparkEmrServerlessJobApiProps, SparkEmrServerlessJobProps } from './spark-job-emr-serverless-props';
import { SparkJobProps } from './spark-job-props';
import { StepFunctionUtils, TrackedConstruct } from '../../../utils';
import { SparkEmrServerlessRuntime } from '../spark-runtime';

/**
 * A construct to run Spark Jobs using EMR Serverless.
 * Creates a State Machine that orchestrates the Spark Job.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job
 *
 * @example
 * import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
 * import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
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
 * const myExecutionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'execRole1', myFileSystemPolicy);
 * const applicationId = "APPLICATION_ID";
 * const job = new dsf.processing.SparkEmrServerlessJob(this, 'SparkJob', {
 *   jobConfig:{
 *     "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
 *     "ApplicationId": applicationId,
 *     "ExecutionRoleArn": myExecutionRole.roleArn,
 *     "JobDriver": {
 *       "SparkSubmit": {
 *           "EntryPoint": "s3://S3-BUCKET/pi.py",
 *           "EntryPointArguments": [],
 *           "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
 *       },
 *     }
 *   }
 * } as dsf.processing.SparkEmrServerlessJobApiProps);
 *
 * new cdk.CfnOutput(this, 'SparkJobStateMachine', {
 *   value: job.stateMachine!.stateMachineArn,
 * });
 */
export class SparkEmrServerlessJob extends SparkJob {

  /**
   * Spark Job execution role. Use this property to add additional IAM permissions if necessary.
   */
  public sparkJobExecutionRole?: IRole;
  private constructJobConfig: SparkEmrServerlessJobApiProps;

  constructor(scope: Construct, id: string, props: SparkEmrServerlessJobProps | SparkEmrServerlessJobApiProps) {
    super(scope, id, SparkEmrServerlessJob.name, props as SparkJobProps);

    let sparkJobExecutionRole: IRole;

    if ('jobConfig' in props) {
      this.constructJobConfig = this.setJobApiPropsDefaults(props as SparkEmrServerlessJobApiProps);
    } else {
      this.constructJobConfig = this.setJobPropsDefaults(props as SparkEmrServerlessJobProps);
    }
    //Tag the AWs Step Functions State Machine
    if (!this.constructJobConfig.jobConfig.Tags) {
      this.constructJobConfig.jobConfig.Tags = {};
    }

    this.constructJobConfig.jobConfig.Tags[TrackedConstruct.DSF_OWNED_TAG] = 'true';

    sparkJobExecutionRole = Role.fromRoleArn(this, `spakrJobRole-${id}`, this.constructJobConfig.jobConfig.ExecutionRoleArn);


    this.stateMachine = this.createStateMachine(
      Duration.minutes(5 + this.constructJobConfig.jobConfig.ExecutionTimeoutMinutes!),
      this.constructJobConfig.schedule);

    this.s3LogBucket?.grantReadWrite(sparkJobExecutionRole);
    this.emrJobLogGroup?.grantRead(sparkJobExecutionRole);
    this.emrJobLogGroup?.grantWrite(sparkJobExecutionRole);

    if (this.emrJobLogGroup) {
      sparkJobExecutionRole.addToPrincipalPolicy(new PolicyStatement({
        actions: ['logs:DescribeLogGroups', 'logs:DescribeLogStreams'],
        resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group::log-stream:*`],
      }));
    }
  }


  /**
   * Returns the props for the Step Functions CallAwsService Construct that starts the Spark job, it calls the [StartJobRun API](https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html)
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */
  protected returnJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrserverless',
      action: 'startJobRun',
      iamAction: 'emrserverless:StartJobRun',
      parameters: this.constructJobConfig.jobConfig,
      iamResources: [`arn:${Aws.PARTITION}:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.constructJobConfig.jobConfig.ApplicationId}/jobruns/*`],
      resultSelector: {
        'JobRunId.$': '$.JobRunId',
      },
    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the Step Functions CallAwsService Construct that checks the execution status of the Spark job, it calls the [GetJobRun API](https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_GetJobRun.html)
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */
  protected returnJobMonitorTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrserverless',
      action: 'getJobRun',
      iamAction: 'emrserverless:GetJobRun',
      parameters: {
        ApplicationId: this.constructJobConfig.jobConfig.ApplicationId,
        JobRunId: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:${Aws.PARTITION}:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.constructJobConfig.jobConfig.ApplicationId}/jobruns/*`],
      resultSelector: {
        'State.$': '$.JobRun.State',
        'StateDetails.$': '$.JobRun.StateDetails',
      },
      resultPath: '$.JobRunState',
    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the step function task that handles the failure if the EMR Serverless job fails.
   * @returns FailProps The error details of the failed Spark Job
   */
  protected returnJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRServerlessJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    } as FailProps;
  }


  /**
   * Returns the status of the EMR Serverless job that succeeded based on the GetJobRun API response
   * @returns string
   */
  protected returnJobStatusSucceed(): string {
    return 'SUCCESS';
  }

  /**
   * Returns the status of the EMR Serverless job that failed based on the GetJobRun API response
   * @returns string
   */
  protected returnJobStatusFailed(): string {
    return 'FAILED';
  }

  /**
   * Returns the status of the EMR Serverless job that is cancelled based on the GetJobRun API response
   * @returns string
   */
  protected returnJobStatusCancelled(): string {
    return 'CANCELLED';
  }

  /**
   * Grants the necessary permissions to the Step Functions StateMachine to be able to start EMR Serverless job
   * @param role Step Functions StateMachine IAM role
   * @see SparkRuntimeServerless.grantJobExecution
   */

  protected grantExecutionRole(role: IRole): void {

    const arn = `arn:aws:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.constructJobConfig.jobConfig.ApplicationId}`;

    SparkEmrServerlessRuntime.grantStartJobExecution(role, [this.constructJobConfig.jobConfig.ExecutionRoleArn], [arn, `${arn}/jobruns/*`]);
  }

  /**
   * Set defaults for the EmrServerlessSparkJobApiProps.
   * @param props EmrServerlessSparkJobApiProps
   */
  private setJobApiPropsDefaults(props: SparkEmrServerlessJobApiProps): SparkEmrServerlessJobApiProps {

    const propsPascalCase = StepFunctionUtils.camelToPascal(props.jobConfig);
    //Set defaults
    propsPascalCase.ClientToken ??= JsonPath.uuid();
    propsPascalCase.ExecutionTimeoutMinutes ??= 30;

    let config = {
      jobConfig: propsPascalCase,
      removalPolicy: props.removalPolicy,
      schedule: props.schedule,
    };

    return config;
  }

  /**
   * Set defaults for the EmrOnEksSparkJobProps.
   * @param props EmrOnEksSparkJobProps
   */
  private setJobPropsDefaults(props: SparkEmrServerlessJobProps): SparkEmrServerlessJobApiProps {

    const config = {
      jobConfig: {
        ConfigurationOverrides: {
          MonitoringConfiguration: {
            S3MonitoringConfiguration: {},
          },
        },
        JobDriver: {
          SparkSubmit: {},
        },
      },
      removalPolicy: props.removalPolicy,
      schedule: props.schedule,
    } as SparkEmrServerlessJobApiProps;

    config.jobConfig.Name = props.name;
    config.jobConfig.ClientToken = JsonPath.uuid();
    config.jobConfig.ExecutionTimeoutMinutes = props.executionTimeoutMinutes ?? 30;
    config.jobConfig.ExecutionRoleArn=props.executionRoleArn;
    config.jobConfig.ApplicationId = props.applicationId;
    config.jobConfig.JobDriver.SparkSubmit.EntryPoint = props.sparkSubmitEntryPoint;

    if (props.sparkSubmitEntryPointArguments) {
      config.jobConfig.JobDriver.SparkSubmit.EntryPointArguments = props.sparkSubmitEntryPointArguments;
    }
    if (props.sparkSubmitParameters) {
      config.jobConfig.JobDriver.SparkSubmit.SparkSubmitParameters = props.sparkSubmitParameters;
    }

    if (props.applicationConfiguration) {
      config.jobConfig.ConfigurationOverrides.ApplicationConfiguration = StepFunctionUtils.camelToPascal(props.applicationConfiguration);
    }

    if (props.s3LogUri && !props.s3LogUri.match(/^s3:\/\/([^\/]+)/)) {
      throw new Error(`Invalid S3 URI: ${props.s3LogUri}`);
    }

    config.jobConfig.ConfigurationOverrides.MonitoringConfiguration.S3MonitoringConfiguration!.LogUri =
    this.createS3LogBucket(props.s3LogUri, props.s3LogUriKeyArn);

    if ( props.s3LogUriKeyArn ) {
      config.jobConfig.ConfigurationOverrides.MonitoringConfiguration.S3MonitoringConfiguration!.EncryptionKeyArn = props.s3LogUriKeyArn;
    }


    if (props.cloudWatchLogGroupName) {
      this.createCloudWatchLogsLogGroup(props.cloudWatchLogGroupName, props.cloudWatchEncryptionKeyArn);
      config.jobConfig.ConfigurationOverrides.MonitoringConfiguration.CloudWatchLoggingConfiguration = {
        Enabled: true,
        EncryptionKeyArn: props.cloudWatchEncryptionKeyArn,
        LogGroupName: props.cloudWatchLogGroupName ?? props.name,
        LogStreamNamePrefix: props.cloudWatchLogGroupStreamPrefix,
      };
    }

    config.jobConfig.Tags = props.tags;

    return config;

  }
}

