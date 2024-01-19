// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests AnalyticsBucket
 *
 * @group unit/best-practice/data-lake/analytics-bucket
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Key } from 'aws-cdk-lib/aws-kms';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks } from 'cdk-nag';
import { AnalyticsBucket } from '../../../../src/storage';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'true' });

const encryptionKey = new Key(stack, 'DataKey', {
  removalPolicy: RemovalPolicy.DESTROY,
  enableKeyRotation: true,
});

// Instantiate AnalyticsBucket Construct with default
new AnalyticsBucket(stack, 'DefaultBucket', {
  encryptionKey,
});

// Instantiate AnalyticsBucket Construct with custom parameters
new AnalyticsBucket(stack, 'CustomBucket', {
  encryptionKey,
  removalPolicy: RemovalPolicy.DESTROY,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

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

