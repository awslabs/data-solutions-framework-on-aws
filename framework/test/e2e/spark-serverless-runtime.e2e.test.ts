// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * E2E test for SparkServerlessRunime
 *
 * @group e2e/spark-runtime-serverless
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import {SparkRuntimeServerless } from '../../src/processing-runtime';
import { EmrVersion } from '../../src/utils';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';

jest.setTimeout(6000000);


const region = 'us-east-1';
// GIVEN
const app = new cdk.App();
const testSstack = new cdk.Stack(app, 'TestStack', {
  env: {
    region: region,
  },
});

const testStack = new TestStack('SparkCICDPipelineTestStack', app, testSstack);
const { stack } = testStack;

// creation of the construct(s) under test
const serverlessRuntime = new SparkRuntimeServerless(stack, 'EmrApp', {
    releaseLabel: EmrVersion.V6_12,
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

const execRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole', s3Read);

new cdk.CfnOutput(stack, 'applicationArn', {
  value: serverlessRuntime.applicationArn
});

new cdk.CfnOutput(stack, 'execRoleArn', {
    value: execRole.roleArn
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
