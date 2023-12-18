// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { TestStack } from './test-stack';
import { S3DataCopy, Utils } from '../../src/utils';

/**
 * E2E test for S3DataCopy
 * @group e2e/s3-data-copy
 */

jest.setTimeout(6000000);
const testStack = new TestStack('S3DataCopyStack');
const { stack } = testStack;

// Set the context value for global data removal policy
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const sourceBucket = Bucket.fromBucketName(stack, 'SourceBucket', 'nyc-tlc');
const bucketName = `test-${stack.region}-${stack.account}-${Utils.generateUniqueHash(stack, 'TargetBucket')}`;

const targetBucket = new Bucket(stack, 'TargetBucket', {
  bucketName,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

new S3DataCopy(stack, 'S3DataCopy', {
  sourceBucket,
  sourceBucketPrefix: 'trip data/',
  sourceBucketRegion: 'us-east-1',
  targetBucket,
});

new CfnOutput(stack, 'Target', {
  value: targetBucket.bucketName,
});


let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test(' S3DataCopy is created', async() => {
  expect(deployResult.Target).toContain('test-eu-west-1-145388625860-4d5ce76e');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);