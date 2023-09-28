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
  sparkJobExecutionRole?: IRole;

  constructor( scope: Construct, id: string, props: EmrOnEksSparkJobProps | EmrOnEksSparkJobApiProps) {
    super(scope, id, EmrOnEksSparkJob.name);
    this.scope = scope;

    if ('jobConfig' in props) {
      this.setJobApiPropsDefaults(props as EmrOnEksSparkJobApiProps);
    } else {
      this.setJobPropsDefaults(props as EmrOnEksSparkJobProps);
    } 

    //Tag the AWs Step Functions State Machine
    if (!this.config.jobConfig.tags) {
      this.config.jobConfig.tags = {};
    }
    this.config.jobConfig.tags[TrackedConstruct.ADSF_OWNED_TAG] = 'true';

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
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.virtualClusterId}`],
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
        VirtualClusterId: this.config.jobConfig.virtualClusterId,
        Id: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.virtualClusterId}/jobruns/*`],
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
      resources: [`arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.virtualClusterId}`, `arn:aws:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/${this.config.jobConfig.virtualClusterId}/jobruns/*`],
      conditions: {
        StringEquals: {
          'emr-containers:ExecutionRoleArn': this.config.jobConfig.executionRoleArn,
        },
      },
    }));
  }

    /**
   * Returns the spark job execution role. Creates a new role if it is not passed as props. 
   * @returns IRole
   */
    getSparkJobExecutionRole(): IRole {
      if (!this.sparkJobExecutionRole){
        this.sparkJobExecutionRole = Role.fromRoleArn(this, 'SparkJobEmrOnEksExecutionRole', this.config.jobConfig.executionRoleArn);
      }
      return this.sparkJobExecutionRole;
    }

    private setJobApiPropsDefaults(props: EmrOnEksSparkJobApiProps): void {

      //Set defaults
      props.jobConfig.clientToken ??= JsonPath.uuid();
      props.jobConfig.releaseLabel ??= EmrRuntimeVersion.V6_9;
      this.config = props;
  

    }
  
    private setJobPropsDefaults(props: EmrOnEksSparkJobProps): void {
  
      const config = {'jobConfig':{}} as EmrOnEksSparkJobApiProps;
      config.jobConfig.name = props.name; 
      config.jobConfig.clientToken = JsonPath.uuid();
      config.jobConfig.virtualClusterId = props.virtualClusterId;
      config.jobConfig.jobDriver.sparkSubmitJobDriver!.entryPoint = props.sparkSubmitEntryPoint;
      if (props.sparkSubmitEntryPointArguments) 
        config.jobConfig.jobDriver.sparkSubmitJobDriver!.entryPointArguments=props.sparkSubmitEntryPointArguments ;
      if (props.sparkSubmitParameters) 
        config.jobConfig.jobDriver.sparkSubmitJobDriver!.sparkSubmitParameters = props.sparkSubmitParameters;
  
      config.jobConfig.configurationOverrides.applicationConfiguration ??= props.applicationConfiguration;

      config.jobConfig.retryPolicyConfiguration!.maxAttempts = props.maxRetries ?? 0;
  
      if (props.s3LogUri && !props.s3LogUri.match(/^s3:\/\/([^\/]+)/)) {
          throw new Error(`Invalid S3 URI: ${props.s3LogUri}`);
      }
      
      config.jobConfig.configurationOverrides.monitoringConfiguration!.s3MonitoringConfiguration!.logUri = this.createS3LogBucket(this.scope, props.s3LogUri);

  
      if (props.cloudWatchLogGroupName) {
        this.createCloudWatchLogsLogGroup(this.scope, props.cloudWatchLogGroupName);
        config.jobConfig.configurationOverrides.monitoringConfiguration!.cloudWatchMonitoringConfiguration! = {
          logGroupName: props.cloudWatchLogGroupName ,
          logStreamNamePrefix: props.cloudWatchLogGroupStreamPrefix ?? props.name,
        }
      }
      
  
      config.jobConfig.tags = props.tags;
  
      this.config = config;
  
  
    }
}



export interface EmrOnEksSparkJobProps extends SparkJobProps {
  name: string,
  virtualClusterId: string,
  releaseLabel?: string, 
  executionRoleArn?: string, 
  sparkSubmitEntryPoint: string,
  sparkSubmitEntryPointArguments?: [ string ], 
  sparkSubmitParameters?: string, 
  applicationConfiguration?: [  
    {
      classification: string,
      properties: { 
        string : string 
      }
    }
  ],
  maxRetries?: number, 
  s3LogUri?: string,  // default = a bucket (encrypted) is created and exposed by the class
  cloudWatchLogGroupName?: string,  // default = no cloudwatch
  cloudWatchLogGroupStreamPrefix?: string, // default = if a CloudWatch log group is provided, the name of the application
  tags?: { 
    string : string 
  }
}

/**
 * Configuration for the EMR on EKS job.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
 */
export interface EmrOnEksSparkJobApiProps extends SparkJobProps {

  /**
   * EMR on EKS Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {
    virtualClusterId: string,
    clientToken?: string,
    configurationOverrides: { 
       applicationConfiguration?: [ 
          { 
             classification: string,
             configurations?: [ 
              { string : string }
             ],
             properties: { 
                string : string 
             }
          }
       ],
       monitoringConfiguration?: { 
          cloudWatchMonitoringConfiguration: { 
             logGroupName: string,
             logStreamNamePrefix: string
          },
          containerLogRotationConfiguration?: { 
             maxFilesToKeep: number,
             rotationSize: string
          },
          persistentAppUI?: string,
          s3MonitoringConfiguration?: { 
             logUri: string
          }
       }
    },
    executionRoleArn: string,
    jobDriver: { 
       sparkSqlJobDriver?: { 
          entryPoint: string,
          sparkSqlParameters: string
       },
       sparkSubmitJobDriver?: { 
          entryPoint: string,
          entryPointArguments: [ string ],
          sparkSubmitParameters: string
       }
    },
    jobTemplateId?: string,
    jobTemplateParameters?: { 
       string : string 
    },
    name: string,
    releaseLabel?: string,
    retryPolicyConfiguration?: { 
       maxAttempts: number
    },
    tags?: { 
      [key:string] : any
    }
  };
}