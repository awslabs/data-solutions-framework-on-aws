// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataLakeCatalog, DataLakeStorage } from '../../src';

/**
 * E2E test for DataCatalogDatabase
 * @group e2e/data-catalog-database
 */

jest.setTimeout(6000000);
const testStack = new TestStack('DataLakeCatalogTestStack');
const { stack } = testStack;

const storage = new DataLakeStorage(stack, 'ExampleDLStorage');
const dataLakeCatalog = new DataLakeCatalog(stack, 'ExampleDLCatalog', {
  bronze: {
    locationPrefix: 'example-bronze-db',
    name: 'example-bronze-db',
    locationBucket: storage.bronzeBucket,
  },
  silver: {
    locationPrefix: 'example-silver-db',
    name: 'example-silver-db',
    locationBucket: storage.silverBucket,
  },
  gold: {
    locationPrefix: 'example-gold-db',
    name: 'example-gold-db',
    locationBucket: storage.goldBucket,
  },
});

new CfnOutput(stack, 'BronzeCatalogDB', {
  value: dataLakeCatalog.bronzeCatalogDatabase.databaseName,
  exportName: 'BronzeCatalogDB',
});

new CfnOutput(stack, 'SilverCatalogDB', {
  value: dataLakeCatalog.silverCatalogDatabase.databaseName,
  exportName: 'SilverCatalogDB',
});

new CfnOutput(stack, 'GoldCatalogDB', {
  value: dataLakeCatalog.goldCatalogDatabase.databaseName,
  exportName: 'GoldCatalogDB',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Database in data catalog is created', async() => {
  expect(deployResult.BronzeCatalogDB).toContain('example-bronze-db');
  expect(deployResult.SilverCatalogDB).toContain('example-silver-db');
  expect(deployResult.GoldCatalogDB).toContain('example-gold-db');


});

afterAll(async () => {
  await testStack.destroy();
}, 900000);