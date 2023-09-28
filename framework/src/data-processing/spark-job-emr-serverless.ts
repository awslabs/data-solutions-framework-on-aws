// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Aws, Duration } from 'aws-cdk-lib';
import { Effect, IRole, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { FailProps, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsServiceProps } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { SparkJob, SparkJobProps } from './spark-job';
import { SparkRuntimeServerless } from '../../processing-runtime/spark-runtime-serverless';
import { TrackedConstruct } from '../../utils';

/**
 * A construct to run Spark Jobs using EMR Serverless.
 * creates a State Machine that orchestrates the Spark Job.
 * @see EmrServerlessSparkJobProps parameters to be specified for the construct
 * @default ExecutionTimeoutMinutes: 30
 * @default ClientToken: universally unique identifier (v4 UUID) generated using random numbers
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
 *               "ApplicationId": applicationId,
 *               "ExecutionRoleArn": myExecutionRole.roleArn,
 *               "JobDriver": {
 *                   "SparkSubmit": {
 *                       "EntryPoint": "s3://S3-BUCKET/pi.py",
 *                       "EntryPointArguments": [],
 *                       "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
 *                   },
 *               }
 *          }
 * } as EmrServerlessSparkJobApiProps);
 *
 * new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
 *   value: job.stateMachine.stateMachineArn,
 * });
 * ```
 */
export class EmrServerlessSparkJob extends SparkJob {
  private config: EmrServerlessSparkJobProps;

  constructor( scope: Construct, id: string, props: EmrServerlessSparkJobProps) {
    super(scope, id, EmrServerlessSparkJob.name);


  constructor(scope: Construct, id: string, props: EmrServerlessSparkJobProps | EmrServerlessSparkJobApiProps) {
    super(scope, id, EmrServerlessSparkJob.name);
    this.scope = scope;
    if ('jobConfig' in props) {
      this.setJobApiPropsDefaults(props as EmrServerlessSparkJobApiProps);
    } else {
      this.setJobPropsDefaults(props as EmrServerlessSparkJobProps);
    } 
    //Tag the AWs Step Functions State Machine

    if (!this.config.jobConfig.tags) {
      this.config.jobConfig.tags = {};
    }
    this.config.jobConfig.tags[TrackedConstruct.ADSF_OWNED_TAG] = 'true';

    if (!this.config.jobConfig.Tags) {
      this.config.jobConfig.Tags = {};
    }
    this.config.jobConfig.Tags[TrackedConstruct.ADSF_OWNED_TAG] = 'true';
    this.stateMachine = this.createStateMachine(this.config.schedule);

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
      service: 'emrserverless',
      action: 'startJobRun',
      iamAction: 'emrserverless:StartJobRun',
      parameters: this.config.jobConfig,
      iamResources: [`arn:${Aws.PARTITION}:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.config.jobConfig.applicationId}/jobruns/*`],
      resultSelector: {
        'JobRunId.$': '$.JobRunId',
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
      service: 'emrserverless',
      action: 'getJobRun',
      iamAction: 'emrserverless:GetJobRun',
      parameters: {
        ApplicationId: this.config.jobConfig.applicationId,
        JobRunId: JsonPath.stringAt('$.JobRunId'),
      },
      iamResources: [`arn:${Aws.PARTITION}:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.config.jobConfig.applicationId}/jobruns/*`],
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
  getJobFailTaskProps(): FailProps {
    return {
      cause: 'EMRServerlessJobFailed',
      error: JsonPath.stringAt('$.JobRunState.StateDetails'),
    } as FailProps;
  }


  /**
   * Returns the status of the EMR Serverless job that succeeded based on the GetJobRun API response
   * @returns string
   */
  getJobStatusSucceed(): string {
    return 'SUCCESS';
  }

  /**
   * Returns the status of the EMR Serverless job that failed based on the GetJobRun API response
   * @returns string
   */
  getJobStatusFailed(): string {
    return 'FAILED';
  }

  /**
   * Returns the spark job execution role. Creates a new role if it is not passed as props. 
   * @returns IRole
   */
  getSparkJobExecutionRole(): IRole {
    if (!this.sparkJobExecutionRole){
      this.sparkJobExecutionRole = this.config.jobConfig.executionRoleArn ? 
      Role.fromRoleArn(this, 'SparkJobEmrServerlessExecutionRole', this.config.jobConfig.executionRoleArn) : 
      SparkRuntimeServerless.createExecutionRole(this,'SparkJobEmrServerlessExecutionRole', new PolicyDocument({
        statements: [ new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
          ],
          resources: [this.config.jobConfig.jobDriver.sparkSubmit.entryPoint.replace('s3://', 'arn:aws:s3:::')],
        })]
      }));
    }
    return this.sparkJobExecutionRole;
  }




  /**
   * Grants the necessary permissions to the Step Functions StateMachine to be able to start EMR Serverless job
   * @param role Step Functions StateMachine IAM role
   * @see SparkRuntimeServerless.grantJobExecution
   */

  grantExecutionRole(role: IRole): void {

    const arn = `arn:aws:emr-serverless:${Aws.REGION}:${Aws.ACCOUNT_ID}:/applications/${this.config.jobConfig.applicationId}`;
    role.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-serverless:TagResource',
      ],
      resources: [arn],
    }));

    SparkRuntimeServerless.grantJobExecution(role, [this.config.jobConfig.executionRoleArn], [arn, `${arn}/jobruns/*`]);

  }

  private setJobApiPropsDefaults(props: EmrServerlessSparkJobApiProps): void {

    //Set defaults
    props.jobConfig.clientToken ??= JsonPath.uuid();
    props.jobConfig.executionTimeoutMinutes ??= 30;

    this.config = props;

  }

  private setJobPropsDefaults(props: EmrServerlessSparkJobProps): void {

    const config = {'jobConfig':{}} as EmrServerlessSparkJobApiProps;
    config.jobConfig.name = props.name; 
    config.jobConfig.clientToken = JsonPath.uuid();
    config.jobConfig.executionTimeoutMinutes = props.executionTimeoutMinutes ?? 30;
    config.jobConfig.applicationId = props.applicationId;
    config.jobConfig.jobDriver.sparkSubmit.entryPoint = props.sparkSubmitEntryPoint;
    config.jobConfig.jobDriver.sparkSubmit.entryPointArguments ??= props.sparkSubmitEntryPointArguments;
    config.jobConfig.jobDriver.sparkSubmit.entryPointParameters ??= props.sparkSubmitParameters;

    config.jobConfig.configurationOverrides.applicationConfiguration ??= props.applicationConfiguration;

    if (props.s3LogUri && !props.s3LogUri.match(/^s3:\/\/([^\/]+)/)) {
        throw new Error(`Invalid S3 URI: ${props.s3LogUri}`);
    }
    

    config.jobConfig.configurationOverrides.monitoringConfiguration.s3MonitoringConfiguration!.logUri = this.createS3LogBucket(this.scope, props.s3LogUri, props.s3LogUriKeyArn);
    config.jobConfig.configurationOverrides.monitoringConfiguration.s3MonitoringConfiguration!.encryptionKeyArn ??= props.s3LogUriKeyArn;

    if (props.cloudWatchLogGroupName) {
      this.createCloudWatchLogsLogGroup(this.scope, props.cloudWatchLogGroupName, props.cloudWatchEncryptionKeyArn);
      config.jobConfig.configurationOverrides.monitoringConfiguration.cloudWatchLoggingConfiguration = {
        enabled: true,
        encryptionKeyArn: props.cloudWatchEncryptionKeyArn,
        logGroupName: props.cloudWatchLogGroupName ?? props.name,
        logStreamNamePrefix: props.cloudWatchLogGroupStreamPrefix,
      }
    }
    

    config.jobConfig.tags = props.tags;

    this.config = config;


  }



}



/**
 * Simplified configuration for the EMR Serverless Job.
 * @param name Spark job name @default Autogenerated
 * @param applicationId EMR Serverless application ID
 * @param executionRoleArn EMR Serverless execution role ARN @default new IAM Role create 
 * @param sparkSubmitEntryPoint The entry point for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html) 
 * @param sparkSubmitEntryPointArguments The arguments for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html) 
 * @param sparkSubmitParameters The parameters for the Spark submit job run. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_SparkSubmit.html)
 * @param applicationConfiguration The override configurations for the application. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ConfigurationOverrides.html)
 * @param executionTimeoutMinutes Job execution timeout in minutes. @default 30
 * @param persistentAppUi Enable Persistent UI. @default true @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ManagedPersistenceMonitoringConfiguration.html)
 * @param persistentAppUIKeyArn Persistent application UI encryption key ARN @default AWS Managed default KMS key used @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_ManagedPersistenceMonitoringConfiguration.html)
 * @param s3LogUri The Amazon S3 destination URI for log publishing. @example s3://BUCKET_NAME/ @default Create new bucket. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_S3MonitoringConfiguration.html)
 * @param s3LogUriKeyArn KMS Encryption key for S3 log monitoring bucket. @default AWS Managed default KMS key used. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_S3MonitoringConfiguration.html)
 * @param cloudWatchLogGroupName CloudWatch log group name for job monitoring.  @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchEncryptionKeyArn CloudWatch log encryption key ARN. @default AWS Managed default KMS key used. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchLogGroupStreamPrefix CloudWatch log group stream prefix. @default The name of the spark job. @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param cloudWatchLogtypes CloudWatch log verbosity type. @default ERROR @see @link(https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_CloudWatchLoggingConfiguration.html)
 * @param tags Tags to be added to the EMR Serverless job. @see @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
 */

export interface EmrServerlessSparkJobProps {
  name: string,
  applicationId: string,
  executionRoleArn?: string, 
  sparkSubmitEntryPoint: string,
  sparkSubmitEntryPointArguments?: [ string ], 
  sparkSubmitParameters?: string, 
  applicationConfiguration?: [
    {
      classification: string,
      configurations: [{ [key: string]: any; }],
      properties: { 
        string : string 
      }
    }
  ],
  executionTimeoutMinutes?: number, 
  persistentAppUi?: boolean, 
  persistentAppUIKeyArn?: string, 
  s3LogUri?: string, 
  s3LogUriKeyArn?: string,  
  cloudWatchLogGroupName?: string, 
  cloudWatchEncryptionKeyArn?: string, 
  cloudWatchLogGroupStreamPrefix?: string, 
  cloudWatchLogtypes?: string, 
  tags?: { 
    string : string 
  }

}


/**
 * Configuration for the EMR Serverless Job API. 
 * Use this interface when EmrServerlessJobProps doesn't give you access to the configuration parameters you need.
 * @param jobConfig The job configuration. @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
 */

export interface EmrServerlessSparkJobApiProps extends SparkJobProps {

  /**
   * EMR Serverless Job Configuration.
   * @link[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]
   */
  readonly jobConfig: {
    applicationId: string;
    clientToken?: string;
    name?:string;
    configurationOverrides:{
      applicationConfiguration?: [ 
        { 
           classification: string,
           configurations: [ { [key:string] : any}],
           properties: { 
              string : string 
           }
        }
     ],
     monitoringConfiguration: { 
        cloudWatchLoggingConfiguration?: { 
           enabled: boolean,
           encryptionKeyArn?: string,
           logGroupName?: string,
           logStreamNamePrefix?: string,
           logTypes?: { 
              string : [ string ]
           }
        },
        managedPersistenceMonitoringConfiguration?: { 
           enabled: boolean,
           encryptionKeyArn: string
        },
        s3MonitoringConfiguration?: { 
           encryptionKeyArn?: string,
           logUri: string
        }
     }
    };
    "executionRoleArn":string;
    "jobDriver":{ [key:string] : any};
    "executionTimeoutMinutes"?:number;
    "tags"?:{ [key:string] : any};

    'ClientToken'?: string;

    'Name'?:string;
    'ConfigurationOverrides'?:{ [key:string] : any};
    'ExecutionRoleArn':string;
    'JobDriver':{ [key:string] : any};
    'ExecutionTimeoutMinutes'?:number;
    'Tags'?:{ [key:string] : any};
  };

}