// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataLakeStorage
 *
 * @group unit/best-practice/data-lake/data-lake-storage
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Key } from 'aws-cdk-lib/aws-kms';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataLakeStorage } from '../../../../src';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'true' });

// Instantiate AnalyticsBucket Construct with default
new DataLakeStorage(stack, 'DefaultDataLakeStorage');

// Instantiate AnalyticsBucket Construct with custom parameters
new DataLakeStorage(stack, 'CustomDataLakeStorage', {
  bronzeBucketName: 'my-bronze',
  bronzeBucketInfrequentAccessDelay: 90,
  bronzeBucketArchiveDelay: 180,
  silverBucketName: 'my-silver',
  silverBucketInfrequentAccessDelay: 180,
  silverBucketArchiveDelay: 360,
  goldBucketName: 'my-gold',
  goldBucketInfrequentAccessDelay: 180,
  goldBucketArchiveDelay: 360,
  removalPolicy: RemovalPolicy.DESTROY,
  dataLakeKey: new Key(stack, 'MyDataLakeKey'),
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/MyDataLakeKey/Resource',
  [{ id: 'AwsSolutions-KMS5', reason: 'The custom DataLakeKey is used for testing, it doesn\'t need to have key rotation enabled' }],
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

