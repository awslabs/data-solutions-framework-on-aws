// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { App, Aspects, CustomResource, Stack } from 'aws-cdk-lib';
import { Match, Annotations } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DsfProvider } from '../../../../src/utils';

/**
 * Nag Tests for DsfProvider construct
 *
 * @group unit/best-practice/dsf-provider
 */

const app = new App();
const stack = new Stack(app, 'Stack');

const myOnEventManagedPolicy = new ManagedPolicy(stack, 'Policy1', {
  document: new PolicyDocument({
    statements: [
      new PolicyStatement({
        actions: [
          's3:*',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    ],
  }),
});

const myIsCompleteManagedPolicy = new ManagedPolicy(stack, 'Policy2', {
  document: new PolicyDocument({
    statements: [
      new PolicyStatement({
        actions: [
          's3:*',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    ],
  }),
});

const myProvider = new DsfProvider(stack, 'Provider', {
  providerName: 'my-provider',
  onEventHandlerDefinition: {
    managedPolicy: myOnEventManagedPolicy,
    handler: 'on-event.handler',
    depsLockFilePath: path.join(__dirname, '../../../resources/utils/lambda/my-cr/package-lock.json'),
    entryFile: path.join(__dirname, '../../../resources/utils/lambda/my-cr/on-event.mjs'),
  },
  isCompleteHandlerDefinition: {
    managedPolicy: myIsCompleteManagedPolicy,
    handler: 'is-complete.handler',
    depsLockFilePath: path.join(__dirname, '../../../resources/utils/lambda/my-cr/package-lock.json'),
    entryFile: path.join(__dirname, '../../../resources/utils/lambda/my-cr/is-complete.mjs'),
  },
});

new CustomResource(stack, 'CustomResource', {
  serviceToken: myProvider.serviceToken,
  resourceType: 'Custom::MyCustomResource',
});
Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/customResourceProvider',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Custom resource provider is an L2 CDK construct' },
    { id: 'AwsSolutions-IAM4', reason: 'Custom resource provider is an L2 CDK construct' },
    { id: 'AwsSolutions-L1', reason: 'Custom resource provider is an L2 CDK construct' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Provider/IsCompleteHandlerLogPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The log stream name is not deterministic' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Provider/OnEventHandlerLogPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The log stream name is not deterministic' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Policy1',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The policy is used for testing only' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Policy2',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The policy is used for testing only' },
  ],
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