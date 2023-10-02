// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests SparkJob construct
 *
 * @group unit/data-processing/spark-job
*/


import { Stack, App, Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { SparkEmrServerlessRuntime } from '../../../src/processing';
import { EmrOnEksSparkJob, EmrOnEksSparkJobApiProps, EmrOnEksSparkJobProps, EmrServerlessSparkJob, EmrServerlessSparkJobApiProps, EmrServerlessSparkJobProps } from '../../../src/processing/spark-job';


import { EmrRuntimeVersion } from '../../../src/utils/emr-releases';


describe('Create an SparkJob using EMR Serverless Application for Spark with schedule', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });


  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);


  new EmrServerlessSparkJob(stack, 'SparkJobServerless', {
    jobConfig: {
      ApplicationId: 'appId',
      ExecutionRoleArn: myExecutionRole.roleArn,
      ConfigurationOverrides: {
        MonitoringConfiguration: {
          S3MonitoringConfiguration: {
            LogUri: 's3://s3-bucket/monitoring-logs',
          },
        },
      },
      JobDriver: {
        SparkSubmit: {
          EntryPoint: 's3://s3-bucket/pi.py',
          SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
        },
      },
    },
    schedule: Schedule.rate(Duration.hours(1)),
  } as EmrServerlessSparkJobApiProps);


  const template = Template.fromStack(stack, {});

  test('State function is created EMR Serverless', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  test('Schedule is created', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(1 hour)',
    });
  });


  test('State machine template definition matches expected format EMR Serverless', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"EmrStartJobTask-SparkJobServerless","States":{"EmrStartJobTask-SparkJobServerless":{"Next":"Wait-SparkJobServerless","Type":"Task","ResultSelector":{"JobRunId.$":"$.JobRunId"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrserverless:startJobRun","Parameters":{"ApplicationId":"appId","ExecutionRoleArn":"',
            { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
            '","ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"}}},"JobDriver":{"SparkSubmit":{"EntryPoint":"s3://s3-bucket/pi.py","SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"ClientToken.$":"States.UUID()","ExecutionTimeoutMinutes":30,"Tags":{"aws-data-solutions-fwk:owned":"true"}}},"Wait-SparkJobServerless":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask-SparkJobServerless"},"EmrMonitorJobTask-SparkJobServerless":{"Next":"JobSucceededOrFailed-SparkJobServerless","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.JobRun.State","StateDetails.$":"$.JobRun.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrserverless:getJobRun","Parameters":{"ApplicationId":"appId","JobRunId.$":"$.JobRunId"}},"JobSucceededOrFailed-SparkJobServerless":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"SUCCESS","Next":"JobSucceeded-SparkJobServerless"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed-SparkJobServerless"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed-SparkJobServerless"}],"Default":"Wait-SparkJobServerless"},"JobSucceeded-SparkJobServerless":{"Type":"Succeed"},"JobFailed-SparkJobServerless":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRServerlessJobFailed"}},"TimeoutSeconds":2100}',
          ],
        ],
      },
    });
  });

});

describe('Create an SparkJob using EMR Serverless Application for Spark using simplified credentials', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });


  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);


  new EmrServerlessSparkJob(stack, 'SparkJobServerless', {
    name: 'SparkSimpleProps',
    applicationId: '00fcn9hll0rv1j09',
    executionRoleArn: myExecutionRole.roleArn,
    executionTimeoutMinutes: 30,
    s3LogUri: 's3://s3-bucket/monitoring-logs',
    cloudWatchLogGroupName: 'spark-serverless-log',
    sparkSubmitEntryPoint: 's3://s3-bucket/pi.py',
    sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
  } as EmrServerlessSparkJobProps);


  const template = Template.fromStack(stack, {});

  test('State function is created EMR Serverless', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  test('State machine template definition matches expected format EMR Serverless', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"EmrStartJobTask-SparkJobServerless","States":{"EmrStartJobTask-SparkJobServerless":{"Next":"Wait-SparkJobServerless","Type":"Task","ResultSelector":{"JobRunId.$":"$.JobRunId"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrserverless:startJobRun","Parameters":{"ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"},"CloudWatchLoggingConfiguration":{"Enabled":true,"LogGroupName":"spark-serverless-log"}}},"JobDriver":{"SparkSubmit":{"EntryPoint":"s3://s3-bucket/pi.py","SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"Name":"SparkSimpleProps","ClientToken.$":"States.UUID()","ExecutionTimeoutMinutes":30,"ExecutionRoleArn":"',
            { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
            '","ApplicationId":"00fcn9hll0rv1j09","Tags":{"aws-data-solutions-fwk:owned":"true"}}},"Wait-SparkJobServerless":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask-SparkJobServerless"},"EmrMonitorJobTask-SparkJobServerless":{"Next":"JobSucceededOrFailed-SparkJobServerless","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.JobRun.State","StateDetails.$":"$.JobRun.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrserverless:getJobRun","Parameters":{"ApplicationId":"00fcn9hll0rv1j09","JobRunId.$":"$.JobRunId"}},"JobSucceededOrFailed-SparkJobServerless":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"SUCCESS","Next":"JobSucceeded-SparkJobServerless"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed-SparkJobServerless"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed-SparkJobServerless"}],"Default":"Wait-SparkJobServerless"},"JobSucceeded-SparkJobServerless":{"Type":"Succeed"},"JobFailed-SparkJobServerless":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRServerlessJobFailed"}},"TimeoutSeconds":2100}',
          ],
        ],
      },
    });
  });

});

describe('Create an SparkJob using EMRonEKS for Spark and grant access', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });

  //TODO add ErmOnEks specific role
  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

  new EmrOnEksSparkJob(stack, 'SparkJobEmrOnEks', {
    jobConfig: {
      Name: 'SparkJob',
      VirtualClusterId: 'clusterId',
      ReleaseLabel: EmrRuntimeVersion.V6_2,
      ExecutionRoleArn: myExecutionRole.roleArn,
      ConfigurationOverrides: {
        MonitoringConfiguration: {
          S3MonitoringConfiguration: {
            LogUri: 's3://s3-bucket/monitoring-logs',
          },
        },
      },
      JobDriver: {
        SparkSubmit: {
          EntryPoint: 's3://s3-bucket/pi.py',
          EntryPointArguments: [],
          SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
        },
      },
    },
  } as EmrOnEksSparkJobApiProps);


  const template = Template.fromStack(stack, {});

  test('State function is created with EmrOnEks', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  test('State template definition matches expected format EmrOnEks', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"EmrStartJobTask-SparkJobEmrOnEks","States":{"EmrStartJobTask-SparkJobEmrOnEks":{"Next":"Wait-SparkJobEmrOnEks","Type":"Task","ResultSelector":{"JobRunId.$":"$.Id"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:StartJobRun","Parameters":{"Name":"SparkJob","VirtualClusterId":"clusterId","ReleaseLabel":"emr-6.2.0","ExecutionRoleArn":"',
            { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
            '","ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"}}},"JobDriver":{"SparkSubmit":{"EntryPoint":"s3://s3-bucket/pi.py","EntryPointArguments":[],"SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"ClientToken.$":"States.UUID()","Tags":{"aws-data-solutions-fwk:owned":"true"}}},"Wait-SparkJobEmrOnEks":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask-SparkJobEmrOnEks"},"EmrMonitorJobTask-SparkJobEmrOnEks":{"Next":"JobSucceededOrFailed-SparkJobEmrOnEks","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.State","StateDetails.$":"$.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:describeJobRun","Parameters":{"VirtualClusterId":"clusterId","Id.$":"$.JobRunId"}},"JobSucceededOrFailed-SparkJobEmrOnEks":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"COMPLETED","Next":"JobSucceeded-SparkJobEmrOnEks"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed-SparkJobEmrOnEks"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed-SparkJobEmrOnEks"}],"Default":"Wait-SparkJobEmrOnEks"},"JobSucceeded-SparkJobEmrOnEks":{"Type":"Succeed"},"JobFailed-SparkJobEmrOnEks":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRonEKSJobFailed"}},"TimeoutSeconds":1800}',
          ],
        ],
      },
    });
  });
});

describe('Create an SparkJob using EMR on EKS using simplified credentials', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });


  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);


  new EmrOnEksSparkJob(stack, 'SparkJobEmrOnEksSimple', {
    name: 'SparkJob',
    virtualClusterId: 'clusterId',
    releaseLabel: EmrRuntimeVersion.V6_2,
    executionRoleArn: myExecutionRole.roleArn,
    s3LogUri: 's3://s3-bucket/monitoring-logs',
    cloudWatchLogGroupName: 'spark-job-log-group-emreks-simple',
    sparkSubmitEntryPoint: 's3://s3-bucket/pi.py',
    sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
  } as EmrOnEksSparkJobProps);


  const template = Template.fromStack(stack, {});

  test('State function is created EMR On EKS', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  test('State machine template definition matches expected format EMR On EKS', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: {
        'Fn::Join': [
          '',
          [
            '{"StartAt":"EmrStartJobTask-SparkJobEmrOnEksSimple","States":{"EmrStartJobTask-SparkJobEmrOnEksSimple":{"Next":"Wait-SparkJobEmrOnEksSimple","Type":"Task","ResultSelector":{"JobRunId.$":"$.Id"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:StartJobRun","Parameters":{"ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"},"CloudWatchMonitoringConfiguration":{"LogGroupName":"spark-job-log-group-emreks-simple","LogStreamNamePrefix":"SparkJob"}}},"RetryPolicyConfiguration":{"MaxAttempts":0},"JobDriver":{"SparkSubmitJobDriver":{"EntryPoint":"s3://s3-bucket/pi.py","SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"Name":"SparkJob","ClientToken.$":"States.UUID()","VirtualClusterId":"clusterId","ExecutionRoleArn":"',
            { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
            '","Tags":{"aws-data-solutions-fwk:owned":"true"}}},"Wait-SparkJobEmrOnEksSimple":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask-SparkJobEmrOnEksSimple"},"EmrMonitorJobTask-SparkJobEmrOnEksSimple":{"Next":"JobSucceededOrFailed-SparkJobEmrOnEksSimple","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.State","StateDetails.$":"$.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:describeJobRun","Parameters":{"VirtualClusterId":"clusterId","Id.$":"$.JobRunId"}},"JobSucceededOrFailed-SparkJobEmrOnEksSimple":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"COMPLETED","Next":"JobSucceeded-SparkJobEmrOnEksSimple"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed-SparkJobEmrOnEksSimple"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed-SparkJobEmrOnEksSimple"}],"Default":"Wait-SparkJobEmrOnEksSimple"},"JobSucceeded-SparkJobEmrOnEksSimple":{"Type":"Succeed"},"JobFailed-SparkJobEmrOnEksSimple":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRonEKSJobFailed"}},"TimeoutSeconds":1800}',
          ],
        ],
      },
    });
  });

});
