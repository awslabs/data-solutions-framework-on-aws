// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataCatalogDatabase
 *
 * @group unit/best-practice/governance/access-data-catalog-database
 */


import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataLakeCatalog } from '../../../../src/governance';
import { DataLakeStorage } from '../../../../src/storage';
import { PermissionModel } from '../../../../src/utils';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const storage = new DataLakeStorage(stack, 'ExampleDLStorage');
new DataLakeCatalog(stack, 'ExampleDLCatalog', {
  dataLakeStorage: storage,
});

new DataLakeCatalog(stack, 'ExampleLfDLCatalog', {
  dataLakeStorage: storage,
  permissionModel: PermissionModel.LAKE_FORMATION,
});

new DataLakeCatalog(stack, 'ExampleHbDLCatalog', {
  dataLakeStorage: storage,
  permissionModel: PermissionModel.HYBRID,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/ExampleDLCatalog/BronzeCatalogDatabase',
  '/Stack/ExampleDLCatalog/SilverCatalogDatabase',
  '/Stack/ExampleDLCatalog/GoldCatalogDatabase',
  '/Stack/ExampleLfDLCatalog/BronzeCatalogDatabase',
  '/Stack/ExampleLfDLCatalog/SilverCatalogDatabase',
  '/Stack/ExampleLfDLCatalog/GoldCatalogDatabase',
  '/Stack/ExampleHbDLCatalog/BronzeCatalogDatabase',
  '/Stack/ExampleHbDLCatalog/SilverCatalogDatabase',
  '/Stack/ExampleHbDLCatalog/GoldCatalogDatabase',
], [
  { id: 'AwsSolutions-GL1', reason: 'Already tested as part of the DataCatalogDatabase construct' },
  { id: 'AwsSolutions-IAM5', reason: 'Already tested as part of the DataCatalogDatabase construct' },
],
true);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/Stack/AWS679f53fac002430cb0da5b7982bd2287/Resource',
  ],
  [{ id: 'CdkNagValidationFailure', reason: 'CDK custom resource provider framework is using intrinsic function to get latest node runtime per region which makes the NAG validation fails' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/Stack/ExampleLfDLCatalog/LakeFormationDataAccessRole/DefaultPolicy/Resource',
    '/Stack/ExampleHbDLCatalog/LakeFormationDataAccessRole/DefaultPolicy/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Using AppSec approved managed policy provided by the Bucket interface' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  [
    { id: 'AwsSolutions-IAM4', reason: 'The permissions are provided by the Custom Resource framework and can\'t be updated' },
    { id: 'AwsSolutions-IAM5', reason: 'The permissions are provided by the Custom Resource framework and can\'t be updated' },
  ],
  true,
);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});