// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataLakeCatalog } from '../../src/governance';
import { DataLakeStorage } from '../../src/storage';

/**
 * E2E test for DataCatalogDatabase
 * @group e2e/governance/data-catalog-database
 */

jest.setTimeout(6000000);
const testStack = new TestStack('DataLakeCatalogTestStack');
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


const storage = new DataLakeStorage(stack, 'ExampleDLStorage', {
  removalPolicy: RemovalPolicy.DESTROY,
});
const dataLakeCatalog = new DataLakeCatalog(stack, 'ExampleDLCatalog', {
  dataLakeStorage: storage,
  databaseName: 'example-db',
  removalPolicy: RemovalPolicy.DESTROY,
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
  expect(deployResult.BronzeCatalogDB).toContain('bronze_example-db');
  expect(deployResult.SilverCatalogDB).toContain('silver_example-db');
  expect(deployResult.GoldCatalogDB).toContain('gold_example-db');


});

afterAll(async () => {
  await testStack.destroy();
}, 900000);