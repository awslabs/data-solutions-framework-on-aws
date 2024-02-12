// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests SparkJob construct
 *
 * @group unit/processing/job/spark-emr-containers
*/


import { Stack, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  EmrRuntimeVersion,
  SparkEmrContainersJob,
  SparkEmrContainersJobApiProps,
  SparkEmrContainersJobProps,
} from '../../../src/processing';


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

  const myExecutionRole = new Role(stack, 'execRole', {
    assumedBy: new ServicePrincipal('eks.amazonaws.com'),
    inlinePolicies: {
      myFileSystemPolicy: myFileSystemPolicy,
    },
  });

  new SparkEmrContainersJob(stack, 'SparkJobEmrOnEks', {
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
  } as SparkEmrContainersJobApiProps);


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
            '{"StartAt":"EmrStartJobTask","States":{"EmrStartJobTask":{"Next":"Wait","Type":"Task","ResultSelector":{"JobRunId.$":"$.Id"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:startJobRun","Parameters":{"Name":"SparkJob","VirtualClusterId":"clusterId","ReleaseLabel":"emr-6.2.0","ExecutionRoleArn":"',
            { 'Fn::GetAtt': [Match.stringLikeRegexp('execRole.*'), 'Arn'] },
            '","ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"}}},"JobDriver":{"SparkSubmit":{"EntryPoint":"s3://s3-bucket/pi.py","EntryPointArguments":[],"SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"ClientToken.$":"States.UUID()","Tags":{"data-solutions-fwk:owned":"true"}}},"Wait":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask"},"EmrMonitorJobTask":{"Next":"JobSucceededOrFailed","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.State","StateDetails.$":"$.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:describeJobRun","Parameters":{"VirtualClusterId":"clusterId","Id.$":"$.JobRunId"}},"JobSucceededOrFailed":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"COMPLETED","Next":"JobSucceeded"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed"}],"Default":"Wait"},"JobSucceeded":{"Type":"Succeed"},"JobFailed":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRonEKSJobFailed"}},"TimeoutSeconds":1800}',
          ],
        ],
      },
    });
  });
});

describe('Create an SparkJob using EMR on EKS using simplified API', () => {

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


  const myExecutionRole = new Role(stack, 'execRole', {
    assumedBy: new ServicePrincipal('eks.amazonaws.com'),
    inlinePolicies: {
      myFileSystemPolicy: myFileSystemPolicy,
    },
  });

  new SparkEmrContainersJob(stack, 'SparkJobEmrOnEksSimple', {
    name: 'SparkJob',
    virtualClusterId: 'clusterId',
    releaseLabel: EmrRuntimeVersion.V6_2,
    executionRole: myExecutionRole,
    s3LogBucket: Bucket.fromBucketName(stack, 'Loggroup', 's3-bucket'),
    s3LogPrefix: 'monitoring-logs',
    cloudWatchLogGroup: LogGroup.fromLogGroupName(stack, 'LogGroup', 'spark-job-log-group-emreks-simple'),
    sparkSubmitEntryPoint: 's3://s3-bucket/pi.py',
    sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
  } as SparkEmrContainersJobProps);


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
            '{"StartAt":"EmrStartJobTask","States":{"EmrStartJobTask":{"Next":"Wait","Type":"Task","ResultSelector":{"JobRunId.$":"$.Id"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:startJobRun","Parameters":{"ConfigurationOverrides":{"MonitoringConfiguration":{"S3MonitoringConfiguration":{"LogUri":"s3://s3-bucket/monitoring-logs"},"CloudWatchMonitoringConfiguration":{"LogGroupName":"spark-job-log-group-emreks-simple","LogStreamNamePrefix":"SparkJob"}}},"RetryPolicyConfiguration":{"MaxAttempts":0},"JobDriver":{"SparkSubmitJobDriver":{"EntryPoint":"s3://s3-bucket/pi.py","SparkSubmitParameters":"--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"}},"Name":"SparkJob","ClientToken.$":"States.UUID()","VirtualClusterId":"clusterId","ExecutionRoleArn":"',
            { 'Fn::GetAtt': [Match.stringLikeRegexp('execRole.*'), 'Arn'] },
            '","Tags":{"data-solutions-fwk:owned":"true"}}},"Wait":{"Type":"Wait","Seconds":60,"Next":"EmrMonitorJobTask"},"EmrMonitorJobTask":{"Next":"JobSucceededOrFailed","Type":"Task","ResultPath":"$.JobRunState","ResultSelector":{"State.$":"$.State","StateDetails.$":"$.StateDetails"},"Resource":"arn:',
            { Ref: 'AWS::Partition' },
            ':states:::aws-sdk:emrcontainers:describeJobRun","Parameters":{"VirtualClusterId":"clusterId","Id.$":"$.JobRunId"}},"JobSucceededOrFailed":{"Type":"Choice","Choices":[{"Variable":"$.JobRunState.State","StringEquals":"COMPLETED","Next":"JobSucceeded"},{"Variable":"$.JobRunState.State","StringEquals":"FAILED","Next":"JobFailed"},{"Variable":"$.JobRunState.State","StringEquals":"CANCELLED","Next":"JobFailed"}],"Default":"Wait"},"JobSucceeded":{"Type":"Succeed"},"JobFailed":{"Type":"Fail","Error":"$.JobRunState.StateDetails","Cause":"EMRonEKSJobFailed"}},"TimeoutSeconds":1800}',
          ],
        ],
      },
    });
  });
});