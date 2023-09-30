// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * E2E test for SparkJob
 *
 * @group e2e/spark-job
 */

import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { EmrServerlessSparkJob, EmrServerlessSparkJobApiProps, EmrServerlessSparkJobProps, SparkEmrServerlessRuntime } from '../../src/';
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';

jest.setTimeout(6000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkJobTestStack', app);
const { stack } = testStack;

// creation of the construct(s) under test
const emrApp = new SparkEmrServerlessRuntime(stack, 'emrApp', {
    name: 'my-test-app',
  });
  
  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: ['*'],
    })],
  });
  
  
  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole', myFileSystemPolicy);
  const myExecutionRole1 = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);
  
  
  const job = new EmrServerlessSparkJob(stack, 'SparkJob', {
    jobConfig: {
      Name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
      ApplicationId: emrApp.applicationId,
      ClientToken: JsonPath.uuid(),
      ExecutionRoleArn: myExecutionRole.roleArn,
      ExecutionTimeoutMinutes: 30,
      ConfigurationOverrides: {
        MonitoringConfiguration: {
          S3MonitoringConfiguration: {
            LogUri: 's3://log-bucker-dummy/monitoring-logs',
          },
        },
      },
      JobDriver: {
        SparkSubmit: {
          EntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
          SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
        },
      },
    },
  } as EmrServerlessSparkJobApiProps);
  
  
  const jobSimple = new EmrServerlessSparkJob(stack, 'SparkJobSimple', {
    Name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
    ApplicationId: emrApp.applicationId,
    ClientToken: JsonPath.uuid(),
    ExecutionRoleArn: myExecutionRole1.roleArn,
    ExecutionTimeoutMinutes: 30,
    S3LogUri: 's3://log-bucker-dummy/monitoring-logs',
    SparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
    SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
  
  } as EmrServerlessSparkJobProps);
  
  new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
    value: job.stateMachine!.stateMachineArn,
  });
  
  new cdk.CfnOutput(stack, 'SparkJobStateMachineSimple', {
    value: jobSimple.stateMachine!.stateMachineArn,
  });

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 900000);

it('Serverless runtime created successfully', async () => {
  // THEN
  expect(deployResult.SparkJobStateMachine).toContain('arn:aws:states:');
  expect(deployResult.SparkJobStateMachineSimple).toContain('arn:aws:states:');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);
