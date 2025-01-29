// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataCatalogDatabase
 *
 * @group unit/best-practice/governance/access-data-catalog-database
 */


import { App, Aspects, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataCatalogDatabase } from '../../../../src/governance';
import { AnalyticsBucket } from '../../../../src/storage';
import { PermissionModel } from '../../../../src/utils';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const encryptionKey = new Key(stack, 'DataKey', {
  removalPolicy: RemovalPolicy.RETAIN,
  enableKeyRotation: true,
});

const bucket = new AnalyticsBucket(stack, 'DefBucket', {
  encryptionKey,
  removalPolicy: RemovalPolicy.RETAIN,
});
const role = new Role(stack, 'TestPrincipal', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});

const db = new DataCatalogDatabase(stack, 'TestCatalogDatabase', {
  locationBucket: bucket,
  locationPrefix: 'sample',
  name: 'sample-db',
});

new DataCatalogDatabase(stack, 'TestLfCatalogDatabase', {
  locationBucket: bucket,
  locationPrefix: 'sample',
  name: 'sample-db',
  permissionModel: PermissionModel.LAKE_FORMATION,
});

new DataCatalogDatabase(stack, 'TestHybridCatalogDatabase', {
  locationBucket: bucket,
  locationPrefix: 'sample',
  name: 'sample-db',
  permissionModel: PermissionModel.HYBRID,
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
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Log retention custom resource provided by CDK framework' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/Stack/TestCatalogDatabase/CrawlerRole/Resource',
    '/Stack/TestLfCatalogDatabase/CrawlerRole/Resource',
    '/Stack/TestHybridCatalogDatabase/CrawlerRole/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Construct allows read only access at the database level, so created policy would allow read access to all tables inside the database' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/Stack/TestCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
    '/Stack/TestLfCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
    '/Stack/TestHybridCatalogDatabase/CrawlerRole/DefaultPolicy/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Using AppSec approved managed policy provided by the Bucket interface' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestCatalogDatabase/DatabaseAutoCrawler',
  [{ id: 'AwsSolutions-GL1', reason: 'Configuring with security configuration causes internal failure in CloudFormation' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/AWS679f53fac002430cb0da5b7982bd2287/Resource',
  [{ id: 'CdkNagValidationFailure', reason: 'CDK custom resource provider framework is using intrinsic function to get latest node runtime per region which makes the NAG validation fails' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/Stack/TestLfCatalogDatabase/LakeFormationRegistrationDataAccessRole/DefaultPolicy/Resource',
    '/Stack/TestHybridCatalogDatabase/LakeFormationRegistrationDataAccessRole/DefaultPolicy/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Using AppSec approved managed policy provided by the Bucket interface' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  [
    { id: 'AwsSolutions-IAM4', reason: 'The permissions are provided by the Custom Resource framework and can\'t be updated' },
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