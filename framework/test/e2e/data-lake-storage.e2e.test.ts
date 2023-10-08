// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataLakeStorage } from '../../src';

/**
 * E2E test for DataLakeStorage
 * @group e2e/data-lake-storage
 */

jest.setTimeout(6000000);
const testStack = new TestStack('DataLakeStorageStack');
const { stack } = testStack;

const testStack2 = new TestStack('DataLakeStorageStack2');

// Set the context value for global data removal policy
stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);
testStack2.stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);

const dataLakeStorage = new DataLakeStorage(stack, 'DLS1', {
  bronzeBucketName: 'mybronze',
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: 'mysilver',
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: 'mygold',
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

const dataLakeStorage2 = new DataLakeStorage(stack, 'DLS2', {
  bronzeBucketName: 'mybronze',
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: 'mysilver',
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: 'mygold',
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

const dataLakeStorage3 = new DataLakeStorage(testStack2.stack, 'DLS1', {
  bronzeBucketName: 'mybronze',
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: 'mysilver',
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: 'mygold',
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

new CfnOutput(stack, 'bronzeBucketName1', {
  value: dataLakeStorage.bronzeBucket.bucketName,
  exportName: 'bronzeBucketName1',
});

new CfnOutput(stack, 'silverBucketName1', {
  value: dataLakeStorage.silverBucket.bucketName,
  exportName: 'silverBucketName1',
});

new CfnOutput(stack, 'goldBucketName1', {
  value: dataLakeStorage.goldBucket.bucketName,
  exportName: 'goldBucketName1',
});

new CfnOutput(stack, 'accessLogsBucketName1', {
  value: dataLakeStorage.accessLogsBucket.bucketName,
  exportName: 'accessLogsBucketName1',
});

new CfnOutput(stack, 'bronzeBucketName2', {
  value: dataLakeStorage2.bronzeBucket.bucketName,
  exportName: 'bronzeBucketName2',
});

new CfnOutput(stack, 'silverBucketName2', {
  value: dataLakeStorage2.silverBucket.bucketName,
  exportName: 'silverBucketName2',
});

new CfnOutput(stack, 'goldBucketName2', {
  value: dataLakeStorage2.goldBucket.bucketName,
  exportName: 'goldBucketName2',
});

new CfnOutput(stack, 'accessLogsBucketName2', {
  value: dataLakeStorage2.accessLogsBucket.bucketName,
  exportName: 'accessLogsBucketName2',
});

new CfnOutput(testStack2.stack, 'bronzeBucketName1', {
  value: dataLakeStorage3.bronzeBucket.bucketName,
  exportName: 'bronzeBucketName3',
});

new CfnOutput(testStack2.stack, 'silverBucketName1', {
  value: dataLakeStorage3.silverBucket.bucketName,
  exportName: 'silverBucketName3',
});

new CfnOutput(testStack2.stack, 'goldBucketName1', {
  value: dataLakeStorage3.goldBucket.bucketName,
  exportName: 'goldBucketName3',
});

new CfnOutput(testStack2.stack, 'accessLogsBucketName1', {
  value: dataLakeStorage3.accessLogsBucket.bucketName,
  exportName: 'accessLogsBucketName3',
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
}, 900000);