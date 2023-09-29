// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, Duration } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob, SparkJobProps } from './spark-job';
import { EmrRuntimeVersion, TrackedConstruct } from '../../utils';


/**
 * A construct to run Spark Jobs using EMR on EKS.
 * creates a State Machine that orchestrates the Spark Job.
 * @see EmrOnEksSparkJobProps parameters to be specified for the construct
 * @default ExecutionTimeoutMinutes: 30
 * @default ClientToken: universally unique identifier (v4 UUID) generated using random numbers
 * @default ReleaseLabel: EMR version 6.2
 *
 * **Usage example**
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
 *          jobConfig:{
 *               "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
 *               "VirtualClusterId": "virtualClusterId",
 *               "ExecutionRoleArn": myExecutionRole.roleArn,
 *               "JobDriver": {
 *                   "SparkSubmit": {
 *                       "EntryPoint": "s3://S3-BUCKET/pi.py",
 *                       "EntryPointArguments": [],
 *                       "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
 *                   },
 *               }
 *          }
 * } as EmrServerlessSparkJobProps);
 *
 * new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
 *   value: job.stateMachine.stateMachineArn,
 * });
 * ```
 */
export class EmrOnEksSparkJob extends SparkJob {
  private scope: Construct;
  private config!: EmrOnEksSparkJobApiProps;

  /**
   * Spark Job execution role. Use this property to add additional IAM permissions if necessary.
   */
  sparkJobExecutionRole?: IRole;

  constructor( scope: Construct, id: string, props: EmrOnEksSparkJobProps | EmrOnEksSparkJobApiProps) {
    super(scope, id, EmrOnEksSparkJob.name, props as SparkJobProps);
    this.scope = scope;

    if ('jobConfig' in props) {
      this.setJobApiPropsDefaults(props as EmrOnEksSparkJobApiProps);
    } else {
      this.setJobPropsDefaults(props as EmrOnEksSparkJobProps);
    }

    //Tag the AWs Step Functions State Machine
    if (!this.config.jobConfig.Tags) {
      this.config.jobConfig.Tags = {};
    }
    this.config.jobConfig.Tags[TrackedConstruct.ADSF_OWNED_TAG] = 'true';

    this.stateMachine = this.createStateMachine(scope, Duration.minutes(30), this.config.schedule);

    this.s3LogBucket?.grantReadWrite(this.getSparkJobExecutionRole());
    this.cloudwatchGroup?.grantWrite(this.getSparkJobExecutionRole());
  }


  /**
   * Returns the props for the Step Functions CallAwsService Construct that starts the Spark job
   * @see CallAwsService @link[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions_tasks.CallAwsService.html]
   * @returns CallAwsServiceProps
   */

  getJobStartTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'StartJobRun',
      iamAction: 'emr-containers:StartJobRun',
      parameters: this.config.jobConfig,
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}`],
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

  getJobMonitorTaskProps(): CallAwsServiceProps {
    return {
      service: 'emrcontainers',
      action: 'describeJobRun',
      iamAction: 'emr-container:DescribeJobRun',
      parameters: {
        VirtualClusterId: this.config.jobConfig.VirtualClusterId,
        Id: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}/jobruns/*`],
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

  getJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRonEKSJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    };
  }

  /**
   * Returns the status of the EMR on EKS job that succeeded  based on the GetJobRun API response
   * @returns string
   */

  getJobStatusSucceed(): string {
    return 'COMPLETED';
  }

  /**
   * Returns the status of the EMR on EKS job that failed based on the GetJobRun API response
   * @returns string
   */

  getJobStatusFailed(): string {
    return 'FAILED';
  }

  /**
   * Grants the necessary permissions to the Step Functions StateMachine to be able to start EMR on EKS job
   * @param role Step Functions StateMachine IAM role
   */

  grantExecutionRole(role: IRole): void {
    role.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-containers:StartJobRun',
        'emr-containers:DescribeJobRun',
      ],
      resources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}`, `arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.VirtualClusterId}/jobruns/*`],
      conditions: {
        StringEquals: {
          'emr-containers:ExecutionRoleArn': this.config.jobConfig.ExecutionRoleArn,
        },
      },
    }));
  }

  /**
   * Returns the spark job execution role. Creates a new role if it is not passed as props.
   * @returns IRole
   */
  getSparkJobExecutionRole(): IRole {
    if (!this.sparkJobExecutionRole) {
      this.sparkJobExecutionRole = Role.fromRoleArn(this, 'SparkJobEmrOnEksExecutionRole', this.config.jobConfig.ExecutionRoleArn);
    }
    return this.sparkJobExecutionRole;
  }


  /**
     * Set defaults for the EmrOnEksSparkJobApiProps.
     * @param props EmrOnEksSparkJobApiProps
     */
  private setJobApiPropsDefaults(props: EmrOnEksSparkJobApiProps): void {

    //Set defaults
    props.jobConfig.ClientToken ??= JsonPath.uuid();
    props.jobConfig.ReleaseLabel ??= EmrRuntimeVersion.V6_9;
    this.config = props;


  }

  /**
     * Set defaults for the EmrOnEksSparkJobProps.
     * @param props EmrOnEksSparkJobProps
     */

  private setJobPropsDefaults(props: EmrOnEksSparkJobProps): void {

    const config = { jobConfig: {} } as EmrOnEksSparkJobApiProps;
    config.jobConfig.Name = props.Name;
    config.jobConfig.ClientToken = JsonPath.uuid();
    config.jobConfig.VirtualClusterId = props.VirtualClusterId;
    config.jobConfig.JobDriver.SparkSubmitJobDriver!.EntryPoint = props.SparkSubmitEntryPoint;
    if (props.SparkSubmitEntryPointArguments) {
      config.jobConfig.JobDriver.SparkSubmitJobDriver!.EntryPointArguments=props.SparkSubmitEntryPointArguments ;
    }
    if (props.SparkSubmitParameters) {config.jobConfig.JobDriver.SparkSubmitJobDriver!.SparkSubmitParameters = props.SparkSubmitParameters;}

    config.jobConfig.ConfigurationOverrides.ApplicationConfiguration ??= props.ApplicationConfiguration;

    config.jobConfig.RetryPolicyConfiguration!.MaxAttempts = props.MaxRetries ?? 0;

    if (props.S3LogUri && !props.S3LogUri.match(/^s3:\/\/([^\/]+)/)) {
      throw new Error(`Invalid S3 URI: ${props.S3LogUri}`);
    }

    config.jobConfig.ConfigurationOverrides.MonitoringConfiguration!.S3MonitoringConfiguration!.LogUri =
    this.createS3LogBucket(this.scope, props.S3LogUri);


    if (props.CloudWatchLogGroupName) {
      this.createCloudWatchLogsLogGroup(this.scope, props.CloudWatchLogGroupName);
      config.jobConfig.ConfigurationOverrides.MonitoringConfiguration!.CloudWatchMonitoringConfiguration! = {
        LogGroupName: props.CloudWatchLogGroupName,
        LogStreamNamePrefix: props.CloudWatchLogGroupStreamPrefix ?? props.Name,
      };
    }


    config.jobConfig.Tags = props.Tags;

    this.config = config;


  }
}

/**
 * Simplified configuration for the EMR on EKS job.
 * @see EmrOnEksSparkJobApiProps if you want to use official AWS SDK spark job properties.
 */

export interface EmrOnEksSparkJobProps extends SparkJobProps {
  readonly Name: string;
  readonly VirtualClusterId: string;
  readonly ReleaseLabel?: string;
  readonly ExecutionRoleArn?: string;
  readonly SparkSubmitEntryPoint: string;
  readonly SparkSubmitEntryPointArguments?: [ string ];
  readonly SparkSubmitParameters?: string;
  readonly ApplicationConfiguration?: [
    {
      Classification: string;
      Properties: {
        string : string;
      };
    }
  ];
  readonly MaxRetries?: number;
  readonly S3LogUri?: string; 
  readonly CloudWatchLogGroupName?: string; 
  readonly CloudWatchLogGroupStreamPrefix?: string;
  readonly Tags?: {
    string : string;
  };
}

/**
 * Configuration for the EMR on EKS job.
 * Use this interface when EmrOnEksSparkJobProps doesn't give you access to the configuration parameters you need.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface EmrOnEksSparkJobApiProps extends SparkJobProps {

  /**
   * EMR on EKS Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {
    VirtualClusterId: string;
    ClientToken?: string;
    ConfigurationOverrides: {
      ApplicationConfiguration?: [
        {
          Classification: string;
          Configurations?: [
            { string : string }
          ];
          Properties: {
            string : string;
          };
        }
      ];
      MonitoringConfiguration?: {
        CloudWatchMonitoringConfiguration?: {
          LogGroupName: string;
          LogStreamNamePrefix: string;
        };
        ContainerLogRotationConfiguration?: {
          MaxFilesToKeep: number;
          RotationSize: string;
        };
        PersistentAppUI?: string;
        S3MonitoringConfiguration?: {
          LogUri: string;
        };
      };
    };
    ExecutionRoleArn: string;
    JobDriver: {
      SparkSqlJobDriver?: {
        EntryPoint: string;
        SparkSqlParameters: string;
      };
      SparkSubmitJobDriver?: {
        EntryPoint: string;
        EntryPointArguments: [ string ];
        SparkSubmitParameters: string;
      };
    };
    JobTemplateId?: string;
    JobTemplateParameters?: {
      string : string;
    };
    Name: string;
    ReleaseLabel?: string;
    RetryPolicyConfiguration?: {
      MaxAttempts: number;
    };
    Tags?: {
      [key:string] : any;
    };
  };
}