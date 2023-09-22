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

// Set the context value for global data removal policy
stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);

const dataLakeStorage = new DataLakeStorage(stack, 'TestDataLakeStorage', {
  bronzeBucketName: 'adsf-test-bronze',
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: 'adsf-test-silver',
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: 'adsf-test-gold',
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
});

new CfnOutput(stack, 'bronzeBucketName', {
  value: dataLakeStorage.bronzeBucket.bucketName,
  exportName: 'bronzeBucketName',
});

new CfnOutput(stack, 'silverBucketName', {
  value: dataLakeStorage.silverBucket.bucketName,
  exportName: 'silverBucketName',
});

new CfnOutput(stack, 'goldBucketName', {
  value: dataLakeStorage.goldBucket.bucketName,
  exportName: 'goldBucketName',
});

new CfnOutput(stack, 'accessLogsBucketName', {
  value: dataLakeStorage.accessLogsBucket.bucketName,
  exportName: 'accessLogsBucketName',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Bronze, silver, and gold buckets are created', async() => {
  expect(deployResult.bronzeBucketName).toContain('adsf-test-bronze');
  expect(deployResult.silverBucketName).toContain('adsf-test-silver');
  expect(deployResult.goldBucketName).toContain('adsf-test-gold');
  expect(deployResult.accessLogsBucketName).toContain('access-logs');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);