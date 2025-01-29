// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataLakeCatalog } from '../../src/governance';
import { DataLakeStorage } from '../../src/storage';
import { PermissionModel } from '../../src/utils';

/**
 * E2E test for DataCatalogDatabase
 * @group e2e/governance/data-lake-catalog
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
  removalPolicy: RemovalPolicy.DESTROY,
});

const lfDataLakeCatalog = new DataLakeCatalog(stack, 'ExampleLfDLCatalog', {
  dataLakeStorage: storage,
  databaseName: 'lakeformation_db',
  permissionModel: PermissionModel.LAKE_FORMATION,
  removalPolicy: RemovalPolicy.DESTROY,
});

const hybridDataLakeCatalog = new DataLakeCatalog(stack, 'ExampleHybridDLCatalog', {
  dataLakeStorage: storage,
  databaseName: 'hybrid_db',
  permissionModel: PermissionModel.HYBRID,
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

new CfnOutput(stack, 'BronzeLfCatalogDB', {
  value: lfDataLakeCatalog.bronzeCatalogDatabase.databaseName,
  exportName: 'BronzeLfCatalogDB',
});

new CfnOutput(stack, 'SilverLfCatalogDB', {
  value: lfDataLakeCatalog.silverCatalogDatabase.databaseName,
  exportName: 'SilverLfCatalogDB',
});

new CfnOutput(stack, 'GoldLfCatalogDB', {
  value: lfDataLakeCatalog.goldCatalogDatabase.databaseName,
  exportName: 'GoldLfCatalogDB',
});

new CfnOutput(stack, 'BronzeHbCatalogDB', {
  value: hybridDataLakeCatalog.bronzeCatalogDatabase.databaseName,
  exportName: 'BronzeHbCatalogDB',
});

new CfnOutput(stack, 'SilverHbCatalogDB', {
  value: hybridDataLakeCatalog.silverCatalogDatabase.databaseName,
  exportName: 'SilverHbCatalogDB',
});

new CfnOutput(stack, 'GoldHbCatalogDB', {
  value: hybridDataLakeCatalog.goldCatalogDatabase.databaseName,
  exportName: 'GoldHbCatalogDB',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Database in data catalog is created', async() => {
  expect(deployResult.BronzeCatalogDB).toContain('bronze');
  expect(deployResult.SilverCatalogDB).toContain('silver');
  expect(deployResult.GoldCatalogDB).toContain('gold');
  expect(deployResult.BronzeLfCatalogDB).toContain('bronze_lakeformation_db');
  expect(deployResult.SilverLfCatalogDB).toContain('silver_lakeformation_db');
  expect(deployResult.GoldLfCatalogDB).toContain('gold_lakeformation_db');
  // expect(deployResult.BronzeHbCatalogDB).toContain('bronze_hybrid_db');
  // expect(deployResult.SilverHbCatalogDB).toContain('silver_hybrid_db');
  // expect(deployResult.GoldHbCatalogDB).toContain('gold_hybrid_db');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);