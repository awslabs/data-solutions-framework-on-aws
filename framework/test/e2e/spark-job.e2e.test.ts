// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for SparkJob
 *
 * @group e2e/processing/spark-job
 */

import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { TestStack } from './test-stack';
import { SparkEmrServerlessJob, SparkEmrServerlessJobApiProps, SparkEmrServerlessJobProps, SparkEmrServerlessRuntime } from '../../src/processing';

jest.setTimeout(6000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkJobTestStack', app);
const { stack } = testStack;

const testStack2 = new TestStack('SparkJobTestStack1', app);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
testStack2.stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// creation of the construct(s) under test
const emrApp = new SparkEmrServerlessRuntime(stack, 'emrApp', {
  name: 'my-test-app',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
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


const job = new SparkEmrServerlessJob(stack, 'SparkJob', {
  jobConfig: {
    Name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
    ApplicationId: emrApp.application.attrApplicationId,
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
  removalPolicy: cdk.RemovalPolicy.DESTROY,
} as SparkEmrServerlessJobApiProps);


// creation of the construct(s) under test
const emrApp2 = new SparkEmrServerlessRuntime(testStack2.stack, 'emrApp', {
  name: 'my-test-app2',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const myFileSystemPolicy2 = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
      's3:PutObject',
    ],
    resources: ['*'],
  })],
});


const myExecutionRole2 = SparkEmrServerlessRuntime.createExecutionRole(testStack2.stack, 'execRole', myFileSystemPolicy2);


const job2 = new SparkEmrServerlessJob(testStack2.stack, 'SparkJob', {
  jobConfig: {
    Name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
    ApplicationId: emrApp2.application.attrApplicationId,
    ClientToken: JsonPath.uuid(),
    ExecutionRoleArn: myExecutionRole2.roleArn,
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
  removalPolicy: cdk.RemovalPolicy.DESTROY,
} as SparkEmrServerlessJobApiProps);


const jobSimple = new SparkEmrServerlessJob(stack, 'SparkJobSimple', {
  name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
  applicationId: emrApp.application.attrApplicationId,
  clientToken: JsonPath.uuid(),
  executionRoleArn: myExecutionRole1.roleArn,
  executionTimeoutMinutes: 30,
  s3LogUri: 's3://log-bucker-dummy/monitoring-logs',
  sparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
  sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
} as SparkEmrServerlessJobProps);

new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
  value: job.stateMachine!.stateMachineArn,
});

new cdk.CfnOutput(stack, 'SparkJobStateMachineSimple', {
  value: jobSimple.stateMachine!.stateMachineArn,
});

new cdk.CfnOutput(testStack2.stack, 'SparkJobStateMachineSimple', {
  value: job2.stateMachine!.stateMachineArn,
});

let deployResult: Record<string, string>;
let deployResult2: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
  deployResult2 = await testStack2.deploy();
}, 900000);

it('Serverless runtime created successfully', async () => {
  // THEN
  expect(deployResult.SparkJobStateMachine).toContain('arn:aws:states:');
  expect(deployResult.SparkJobStateMachineSimple).toContain('arn:aws:states:');
});

it('Job on stack 2 created successfullly', async () => {
  // THEN
  expect(deployResult2.SparkJobStateMachineSimple).toContain('arn:aws:states:');
});

afterAll(async () => {
  await testStack.destroy();
  await testStack2.destroy();
}, 900000);
