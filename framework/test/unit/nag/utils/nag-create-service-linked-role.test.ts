// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Match, Annotations } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { CreateServiceLinkedRole } from '../../../../src/utils';

/**
 * Nag Tests Tracked Construct
 *
 * @group unit/best-practice/create-service-linked-role
 */
const app = new App();
const stack = new Stack(app, 'Stack');
const slr = new CreateServiceLinkedRole(stack, 'CreateSLR');
slr.create('redshift.amazonaws.com');
Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressions(slr, [
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Required to provide flexibility when creating service linked role',
  },
  {
    id: 'AwsSolutions-IAM4',
    reason: 'Managed policies used by CDK framework',
  },
  {
    id: 'AwsSolutions-L1',
    reason: 'Pertains to functions that are part of the CDK framework',
  },
], true);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
], [
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Default policy managed by CDK framework',
  },
  {
    id: 'AwsSolutions-IAM4',
    reason: 'Managed policies used by CDK framework',
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