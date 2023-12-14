// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Match, Annotations } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { S3DataCopy } from '../../../../src/utils';

/**
 * Nag Tests Tracked Construct
 *
 * @group unit/best-practice/s3-data-copy
 */

const app = new App();
const stack = new Stack(app, 'Stack');

const sourceBucket = Bucket.fromBucketName(stack, 'sourceBucket', 'nyc-tlc');
const targetBucket = Bucket.fromBucketName(stack, 'destinationBucket', 'bronze');

new S3DataCopy(stack, 'S3DataCopy', {
  sourceBucket,
  sourceBucketRegion: 'us-east-1',
  targetBucket,
});
Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/S3DataCopy/Policy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'The log stream name is not predictable, the ENI for VPC execution requires wildcard on network interface setup.' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/S3DataCopy/Role/DefaultPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'GetObject*, List*, DeleteObject*, Abort* are provided by the grant methods on CDK L2 Bucket' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole',
  [
    { id: 'AwsSolutions-IAM4', reason: 'LogRetention from the custom resource framework in CDK' },
    { id: 'AwsSolutions-IAM5', reason: 'LogRetention from the custom resource framework in CDK' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/S3DataCopy/Provider/framework-onEvent',
  [
    { id: 'AwsSolutions-IAM4', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-IAM5', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-L1', reason: 'Custom Resource provider from the CDK framework' },
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