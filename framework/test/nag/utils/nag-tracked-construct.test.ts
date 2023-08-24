// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Nag Tests Tracked Construct
 *
 * @group unit/best-practice/tracked-construct
 */

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks } from 'cdk-nag';
import { TrackedConstruct } from '../../../src/utils/tracked-construct';


const mockApp = new App();

const trackedConstructStack = new Stack(mockApp, 'tracked-construct');

// Instantiate TrackedConstruct Construct
new TrackedConstruct(trackedConstructStack, 'TrackedConstruct', { trackingTag: 'TAG' });

Aspects.of(trackedConstructStack).add(new AwsSolutionsChecks({ verbose: true }));

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(trackedConstructStack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(trackedConstructStack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});