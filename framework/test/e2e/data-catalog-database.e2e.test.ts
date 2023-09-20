// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { TestStack } from './test-stack';
import { DataCatalogDatabase } from '../../src';

/**
 * E2E test for DataCatalogDatabase
 * @group e2e/data-catalog-database
 */

jest.setTimeout(6000000);
const testStack = new TestStack('TestStack');
const { stack } = testStack;

const encryptionKey = new Key(stack, 'DataKey', {
  removalPolicy: RemovalPolicy.DESTROY,
});

const bucket = new Bucket(stack, 'TestBucket', {
  removalPolicy: RemovalPolicy.DESTROY,
  encryptionKey,
});

const database = new DataCatalogDatabase(stack, 'TestDatabase', {
  locationBucket: bucket,
  locationPrefix: 'test-database',
  name: 'test-database',
});

const role = new Role(stack, 'TestPrincipal', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});

database.grantReadOnlyAccess(role);

new CfnOutput(stack, 'DatabaseName', {
  value: database.databaseName,
  exportName: 'DatabaseName',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Database in data catalog is created', async() => {
  expect(deployResult.DatabaseName).toContain('test-database');


});

afterAll(async () => {
  await testStack.destroy();
}, 900000);