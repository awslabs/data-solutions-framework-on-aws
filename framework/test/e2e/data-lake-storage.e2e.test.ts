// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { BucketUtils } from '../../src';
import { DataLakeStorage } from '../../src/storage';

/**
 * E2E test for DataLakeStorage
 * @group e2e/data-lake-storage
 */

jest.setTimeout(6000000);
const testStack = new TestStack('DataLakeStorageStack');
const { stack } = testStack;

const testStack2 = new TestStack('Stack2');

// Set the context value for global data removal policy
stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);
testStack2.stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);

const dataLakeStorage = new DataLakeStorage(stack, 'DataLake1', {
  bronzeBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake1', 'mybronze'),
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake1', 'mysilver'),
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake1', 'mygold'),
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

const dataLakeStorage2 = new DataLakeStorage(stack, 'DataLake2', {
  bronzeBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake2', 'mybronze'),
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake2', 'mysilver'),
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: BucketUtils.generateUniqueBucketName(stack, 'DataLake2', 'mygold'),
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

const dataLakeStorage3 = new DataLakeStorage(testStack2.stack, 'DataLake1', {
  bronzeBucketName: BucketUtils.generateUniqueBucketName(testStack2.stack, 'DataLake1', 'mybronze'),
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: BucketUtils.generateUniqueBucketName(testStack2.stack, 'DataLake1', 'mysilver'),
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: BucketUtils.generateUniqueBucketName(testStack2.stack, 'DataLake1', 'mygold'),
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

new CfnOutput(stack, 'bronzeBucketName1', {
  value: dataLakeStorage.bronzeBucket.bucketName,
});

new CfnOutput(stack, 'silverBucketName1', {
  value: dataLakeStorage.silverBucket.bucketName,
});

new CfnOutput(stack, 'goldBucketName1', {
  value: dataLakeStorage.goldBucket.bucketName,
});

new CfnOutput(stack, 'accessLogsBucketName1', {
  value: dataLakeStorage.accessLogsBucket.bucketName,
});

new CfnOutput(stack, 'bronzeBucketName2', {
  value: dataLakeStorage2.bronzeBucket.bucketName,
});

new CfnOutput(stack, 'silverBucketName2', {
  value: dataLakeStorage2.silverBucket.bucketName,
});

new CfnOutput(stack, 'goldBucketName2', {
  value: dataLakeStorage2.goldBucket.bucketName,
});

new CfnOutput(stack, 'accessLogsBucketName2', {
  value: dataLakeStorage2.accessLogsBucket.bucketName,
});

new CfnOutput(testStack2.stack, 'bronzeBucketName1', {
  value: dataLakeStorage3.bronzeBucket.bucketName,
});

new CfnOutput(testStack2.stack, 'silverBucketName1', {
  value: dataLakeStorage3.silverBucket.bucketName,
});

new CfnOutput(testStack2.stack, 'goldBucketName1', {
  value: dataLakeStorage3.goldBucket.bucketName,
});

new CfnOutput(testStack2.stack, 'accessLogsBucketName1', {
  value: dataLakeStorage3.accessLogsBucket.bucketName,
});

let deployResult: Record<string, string>;
let deployResult2: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
  deployResult2 = await testStack2.deploy();
}, 900000);

test('2 DataLakeStorage constructs are created in the same stack', async() => {
  expect(deployResult.bronzeBucketName1).toContain('mybronze');
  expect(deployResult.silverBucketName1).toContain('mysilver');
  expect(deployResult.goldBucketName1).toContain('mygold');
  expect(deployResult.accessLogsBucketName1).toContain('accesslogs');
  expect(deployResult.bronzeBucketName2).toContain('mybronze');
  expect(deployResult.silverBucketName2).toContain('mysilver');
  expect(deployResult.goldBucketName2).toContain('mygold');
  expect(deployResult.accessLogsBucketName2).toContain('accesslogs');
});

test('2 DataLakeStorage constructs are created in different stacks', async() => {
  expect(deployResult2.bronzeBucketName1).toContain('mybronze');
  expect(deployResult2.silverBucketName1).toContain('mysilver');
  expect(deployResult2.goldBucketName1).toContain('mygold');
  expect(deployResult2.accessLogsBucketName1).toContain('accesslogs');
});

afterAll(async () => {
  await testStack.destroy();
  await testStack2.destroy();
}, 900000);