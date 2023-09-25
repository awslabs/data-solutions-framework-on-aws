// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataCatalogDatabase
 *
 * @group unit/best-practice/data-catalog/access-data-catalog-database
 */


import { App, Aspects, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { AnalyticsBucket, DataLakeCatalog } from '../../../../src';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const encryptionKey = new Key(stack, 'DataKey', {
  removalPolicy: RemovalPolicy.RETAIN,
  enableKeyRotation: true,
});

const bucket = new AnalyticsBucket(stack, 'DefaultAnalyticsBucket', {
  encryptionKey,
  removalPolicy: RemovalPolicy.RETAIN,
});
const role = new Role(stack, 'TestPrincipal', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});

const db = new DataLakeCatalog(stack, 'TestCatalogDatabase', {
  locationBucket: bucket,
  locationPrefix: 'sample',
  name: 'sample-db',
});

db.grantReadOnlyAccess(role);

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestPrincipal/DefaultPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Using AppSec approved managed policy provided by the Bucket interface' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestCatalogDatabase/CrawlerRole/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Construct allows read only access at the database level, so created policy would allow read access to all tables inside the database' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Using AppSec approved managed policy provided by the Bucket interface' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestCatalogDatabase/DatabaseAutoCrawler',
  [{ id: 'AwsSolutions-GL1', reason: 'Configuring with security configuration causes internal failure in CloudFormation' }],
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