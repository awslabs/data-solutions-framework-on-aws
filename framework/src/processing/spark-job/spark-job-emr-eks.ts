// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, Duration } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob, SparkJobProps } from './spark-job';
import { EMR_DEFAULT_VERSION, TrackedConstruct } from '../../utils';
import { StepFunctionUtils } from '../../utils/step-function-utils';


/**
 * A construct to run Spark Jobs using EMR on EKS.
 * Creates a Step Functions State Machine that orchestrates the Spark Job.
 * @see SparkEmrEksJobProps parameters to be specified for the construct
 * @default ExecutionTimeoutMinutes: 30
 * @default ClientToken: universally unique identifier (v4 UUID) generated using random numbers
 * @default ReleaseLabel: EMR version 6.12
 *
 * **Usage example**
 * @example
 *
 * const job = new SparkJob(stack, 'SparkJob', {
 *          jobConfig:{
 *               "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
 *               "VirtualClusterId": "virtualClusterId",
 *               "ExecutionRoleArn": "ROLE-ARN",
 *               "JobDriver": {
 *                   "SparkSubmit": {
 *                       "EntryPoint": "s3://S3-BUCKET/pi.py",
 *                       "EntryPointArguments": [],
 *                       "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
 *                   },
 *               }
 *          }
 * } as EmrOnEksSparkJobApiProps);
 *
 * new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
 *   value: job.stateMachine.stateMachineArn,
 * });
 */
export class SparkEmrEksJob extends SparkJob {

  private constructJobConfig: SparkEmrEksJobApiProps;

  constructor( scope: Construct, id: string, props: SparkEmrEksJobProps | SparkEmrEksJobApiProps) {
    super(scope, id, SparkEmrEksJob.name, props as SparkJobProps);

    let sparkJobExecutionRole: IRole;

    if ('jobConfig' in props) {
      this.constructJobConfig = this.setJobApiPropsDefaults(props as SparkEmrEksJobApiProps);
    } else {
      this.constructJobConfig = this.setJobPropsDefaults(props as SparkEmrEksJobProps);
    }

    sparkJobExecutionRole = Role.fromRoleArn(this, `spakrJobRole-${id}`, this.constructJobConfig.jobConfig.ExecutionRoleArn);

    //Tag the AWS Step Functions State Machine
    if (!this.constructJobConfig.jobConfig.Tags) {
      this.constructJobConfig.jobConfig.Tags = {};
    }
    this.constructJobConfig.jobConfig.Tags[TrackedConstruct.ADSF_OWNED_TAG] = 'true';

    const executionTimeout = props.executionTimeoutMinutes ?? 30;
    this.stateMachine = this.createStateMachine(Duration.minutes(executionTimeout), this.constructJobConfig.schedule);

    this.s3LogBucket?.grantReadWrite(sparkJobExecutionRole);
    this.cloudwatchGroup?.grantRead(sparkJobExecutionRole);
    this.cloudwatchGroup?.grantWrite(sparkJobExecutionRole);
    if (this.cloudwatchGroup) {
      sparkJobExecutionRole.addToPrincipalPolicy(new PolicyStatement({
        actions: ['logs:DescribeLogGroups', 'logs:DescribeLogStreams'],
        resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group::log-stream:*`],
      }));
    }
  }


  /**
   * Returns the props for the Step Functions CallAwsService Construct that starts the Spark job, it calls the [StartJobRun API](https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html)
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  protected returnJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'startJobRun',
      iamAction: 'emr-containers:StartJobRun',
      parameters: this.constructJobConfig.jobConfig,
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.constructJobConfig.jobConfig.VirtualClusterId}`],
      resultSelector: {
        'JobRunId.$': '$.Id',
      },
    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the Step Functions CallAwsService Construct that checks the execution status of the Spark job
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  protected returnJobMonitorTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'describeJobRun',
      iamAction: 'emr-container:DescribeJobRun',
      parameters: {
        VirtualClusterId: this.constructJobConfig.jobConfig.VirtualClusterId,
        Id: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.constructJobConfig.jobConfig.VirtualClusterId}/jobruns/*`],
      resultSelector: {
        'State.$': '$.State',
        'StateDetails.$': '$.StateDetails',
      },
      resultPath: '$.JobRunState',
    } as CallAwsServiceProps;
  }

  /**
   * Returns the props for the Step Functions task that handles the failure  if the EMR Serverless job fails.
   * @returns FailProps The error details of the failed Spark Job
   */
  protected returnJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRonEKSJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    };
  }

  /**
   * Returns the status of the EMR on EKS job that succeeded  based on the GetJobRun API response
   * @returns string
   */
  protected returnJobStatusSucceed(): string {
    return 'COMPLETED';
  }

  /**
   * Returns the status of the EMR on EKS job that failed based on the GetJobRun API response
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
   * Grants the necessary permissions to the Step Functions StateMachine to be able to start EMR on EKS job
   * @param role Step Functions StateMachine IAM role
   */
  protected grantExecutionRole(role: IRole): void {
    role.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-containers:StartJobRun',
        'emr-containers:DescribeJobRun',
      ],
      resources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.constructJobConfig.jobConfig.VirtualClusterId}`, `arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.constructJobConfig.jobConfig.VirtualClusterId}/jobruns/*`],
      conditions: {
        StringEquals: {
          'emr-containers:ExecutionRoleArn': this.constructJobConfig.jobConfig.ExecutionRoleArn,
        },
      },
    }));
  }


  /**
   * Set defaults for the EmrOnEksSparkJobApiProps.
   * @param props EmrOnEksSparkJobApiProps
   */
  private setJobApiPropsDefaults(props: SparkEmrEksJobApiProps): SparkEmrEksJobApiProps {

    const propsPascalCase = StepFunctionUtils.camelToPascal(props.jobConfig);
    //Set defaults
    propsPascalCase.ClientToken ??= JsonPath.uuid();
    propsPascalCase.ReleaseLabel ??= EMR_DEFAULT_VERSION;

    const config = {
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
  private setJobPropsDefaults(props: SparkEmrEksJobProps): SparkEmrEksJobApiProps {
    const config = {
      jobConfig: {
        ConfigurationOverrides: {
          MonitoringConfiguration: {
            S3MonitoringConfiguration: {},
          },
        },
        RetryPolicyConfiguration: {},
        JobDriver: {
          SparkSubmitJobDriver: {},
        },
      },
    } as SparkEmrEksJobApiProps;

    config.jobConfig.Name = props.name;
    config.jobConfig.ClientToken = JsonPath.uuid();
    config.jobConfig.VirtualClusterId = props.virtualClusterId;
    config.jobConfig.ExecutionRoleArn=props.executionRoleArn;
    config.jobConfig.JobDriver.SparkSubmitJobDriver!.EntryPoint = props.sparkSubmitEntryPoint;

    if (props.sparkSubmitEntryPointArguments) {
      config.jobConfig.JobDriver.SparkSubmitJobDriver!.EntryPointArguments=props.sparkSubmitEntryPointArguments ;
    }
    if (props.sparkSubmitParameters) {
      config.jobConfig.JobDriver.SparkSubmitJobDriver!.SparkSubmitParameters = props.sparkSubmitParameters;
    }

    if (props.applicationConfiguration) {
      config.jobConfig.ConfigurationOverrides.ApplicationConfiguration = StepFunctionUtils.camelToPascal(props.applicationConfiguration);
    }

    config.jobConfig.RetryPolicyConfiguration!.MaxAttempts = props.maxRetries ?? 0;

    if (props.s3LogUri && 
      (!props.s3LogUri.match(/^s3:\/\/([^\/]+)/) || !props.s3LogUri.match(/^Token\[([0-9]+)\]$/))) {
      throw new Error(`Invalid S3 URI: ${props.s3LogUri}`);
    }

    config.jobConfig.ConfigurationOverrides.MonitoringConfiguration!.S3MonitoringConfiguration!.LogUri =
    this.createS3LogBucket(props.s3LogUri);

    if (props.cloudWatchLogGroupName) {
      this.createCloudWatchLogsLogGroup(props.cloudWatchLogGroupName);
      config.jobConfig.ConfigurationOverrides.MonitoringConfiguration!.CloudWatchMonitoringConfiguration! = {
        LogGroupName: props.cloudWatchLogGroupName,
        LogStreamNamePrefix: props.cloudWatchLogGroupStreamPrefix ?? props.name,
      };
    }

    config.jobConfig.Tags = props.tags;
    return config;
  }
}

/**
 * Simplified configuration for the EMR Serverless Job.
 * @param name Spark job name @default Autogenerated
 * @param virtualClusterId EMR Serverless application ID
 * @param releaseLabel the EMR runtime to use @default EMR_DEFAULT_VERSION
 * @param executionRoleArn EMR on EKS execution role ARN
 * @param sparkSubmitEntryPoint The entry point for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html)
 * @param sparkSubmitEntryPointArguments The arguments for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html)
 * @param sparkSubmitParameters The parameters for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html)
 * @param applicationConfiguration The override configurations for the application. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_ConfigurationOverrides.html#emroneks-Type-ConfigurationOverrides-applicationConfiguration)
 * @param executionTimeoutMinutes Job execution timeout in minutes. @default 30
 * @param maxRetries The maximum number of attempts on the job's driver.
 * @param s3LogUri The Amazon S3 destination URI for log publishing. @default Create new bucket. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_S3MonitoringConfiguration.html#emroneks-Type-S3MonitoringConfiguration-logUri)
 * @param cloudWatchLogGroupName CloudWatch log group name for job monitoring.  @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_CloudWatchMonitoringConfiguration.html#emroneks-Type-CloudWatchMonitoringConfiguration-logGroupName)
 * @param cloudWatchLogGroupStreamPrefix CloudWatch log group stream prefix. @default The name of the spark job. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_CloudWatchMonitoringConfiguration.html#emroneks-Type-CloudWatchMonitoringConfiguration-logGroupName)
 * @param tags Tags to be added to the EMR Serverless job. @see @link(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html#emroneks-StartJobRun-request-tags)
 */
export interface SparkEmrEksJobProps extends SparkJobProps {
  readonly name: string;
  readonly virtualClusterId: string;
  readonly releaseLabel?: string;
  readonly executionRoleArn: string;
  readonly sparkSubmitEntryPoint: string;
  readonly sparkSubmitEntryPointArguments?: string[];
  readonly sparkSubmitParameters?: string;
  readonly applicationConfiguration?:{[key: string] : any};
  readonly executionTimeoutMinutes?:number;
  readonly maxRetries?: number;
  readonly s3LogUri?: string;
  readonly cloudWatchLogGroupName?: string;
  readonly cloudWatchLogGroupStreamPrefix?: string;
  readonly tags?: {
    [key:string] : any;
  };
}

/**
 * Configuration for the EMR on EKS job.
 * Use this interface when EmrOnEksSparkJobProps doesn't give you access to the configuration parameters you need.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface SparkEmrEksJobApiProps extends SparkJobProps {

  /**
   * Job execution timeout in minutes. @default 30
   */
  readonly executionTimeoutMinutes?: number;

  /**
   * EMR on EKS Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {[key: string] : any};
}
