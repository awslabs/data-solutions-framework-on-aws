// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests AccessLogsBucket
 *
 * @group unit/best-practice/data-lake/access-logs-bucket
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { AccessLogsBucket } from '../../../../src';

const app = new App();
const stack = new Stack(app, 'Stack');

// Instantiate AccessLogsBucket Construct with default
new AccessLogsBucket(stack, 'DefaultAccessLogsBucket');

// Instantiate AccessLogsBucket Construct with custom parameters
new AccessLogsBucket(stack, 'CustomAccessLogsBucket', {
  bucketName: 'custom-access-logs',
  encryption: BucketEncryption.KMS_MANAGED,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});


Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/DefaultAccessLogsBucket/Resource',
  [{ id: 'AwsSolutions-S1', reason: 'This bucket is used for s3 server access log so we don\'t log access' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/CustomAccessLogsBucket/Resource',
  [{ id: 'AwsSolutions-S1', reason: 'This bucket is used for s3 server access log so we don\'t log access' }],
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

