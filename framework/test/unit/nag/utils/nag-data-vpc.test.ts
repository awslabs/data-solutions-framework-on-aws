// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Match, Annotations } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { DataVpc } from '../../../../src/utils';

/**
 * Nag Tests Tracked Construct
 *
 * @group unit/best-practice/data-vpc
 */

const app = new App();
const stack = new Stack(app, 'Stack');

const dataVpc = new DataVpc(stack, 'DataVpc', {
  vpcCidr: '10.0.0.0/16',
});

dataVpc.tagVpc('test-tag', 'test-value');

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