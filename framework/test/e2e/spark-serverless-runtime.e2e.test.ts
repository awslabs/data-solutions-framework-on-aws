// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * E2E test for SparkServerlessRunime
 *
 * @group e2e/spark-runtime-serverless
 */

import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { SparkEmrServerlessRuntime } from '../../src/';

jest.setTimeout(6000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkServerlessTestStack', app);
const { stack } = testStack;

// creation of the construct(s) under test
const serverlessRuntime = new SparkEmrServerlessRuntime(stack, 'EmrApp', {
  name: 'SparkRuntimeServerless',
});

const s3Read = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
  })],
});

const execRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole', s3Read);

new cdk.CfnOutput(stack, 'applicationArn', {
  value: serverlessRuntime.applicationArn,
});

new cdk.CfnOutput(stack, 'execRoleArn', {
  value: execRole.roleArn,
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 900000);

it('Serverless runtime created successfully', async () => {
  // THEN
  expect(deployResult.applicationArn).toContain('applications');
  expect(deployResult.execRoleArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);
