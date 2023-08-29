// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// TODO : remove this file once we have real e2e tests

/**
 * E2E test sample
 *
 * @group e2e/sample
 */

import * as cdk from 'aws-cdk-lib';
import { Names, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { TestStack } from './test-stack';

jest.setTimeout(6000000);

// GIVEN
const testStack = new TestStack('SampleTest');
const { stack } = testStack;

// creation of the construct(s) under test
const bucket = new Bucket(stack, 'sampleTestBucket', {
  bucketName: 'sample-test-bucket-' + Names.uniqueResourceName(stack, {}).toLowerCase(),
  removalPolicy: RemovalPolicy.DESTROY,
});
new cdk.CfnOutput(stack, 'BucketName', {
  value: bucket.bucketName,
  exportName: 'bucketName',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 900000);

it('bucket created successfully', async () => {
  // THEN
  expect(deployResult.BucketName).toContain('sample-test-bucket-');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);
