// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataCatalogDatabase
 *
 * @group unit/best-practice/data-catalog/access-data-catalog-database
 */


import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataLakeCatalog } from '../../../../src/governance';
import { DataLakeStorage } from '../../../../src/storage';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const storage = new DataLakeStorage(stack, 'ExampleDLStorage');
new DataLakeCatalog(stack, 'ExampleDLCatalog', {
  dataLakeStorage: storage,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/ExampleDLCatalog/BronzeCatalogDatabase/DatabaseAutoCrawler',
  '/Stack/ExampleDLCatalog/SilverCatalogDatabase/DatabaseAutoCrawler',
  '/Stack/ExampleDLCatalog/GoldCatalogDatabase/DatabaseAutoCrawler',
  '/Stack/ExampleDLCatalog/BronzeCatalogDatabase/CrawlerRole/Resource',
  '/Stack/ExampleDLCatalog/BronzeCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
  '/Stack/ExampleDLCatalog/SilverCatalogDatabase/CrawlerRole/Resource',
  '/Stack/ExampleDLCatalog/SilverCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
  '/Stack/ExampleDLCatalog/GoldCatalogDatabase/CrawlerRole/Resource',
  '/Stack/ExampleDLCatalog/GoldCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
], [
  {
    id: 'AwsSolutions-GL1',
    reason: 'Configuring with security configuration causes internal failure in CloudFormation',
  },
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Construct allows read only access at the database level, so created policy would allow read access to all tables inside the database',
  },
]);

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