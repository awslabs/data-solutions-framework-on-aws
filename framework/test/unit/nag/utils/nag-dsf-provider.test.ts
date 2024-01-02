// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { App, Aspects, CustomResource, Stack } from 'aws-cdk-lib';
import { Match, Annotations } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DsfProvider } from '../../../../src/utils/lib/dsf-provider';

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
  'Stack/CustomResourceProvider/framework-onTimeout',
  [
    { id: 'AwsSolutions-L1', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM5', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM4', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/CustomResourceProvider/framework-isComplete/Resource',
  [
    { id: 'AwsSolutions-L1', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM5', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM4', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/CustomResourceProvider/framework-onEvent/Resource',
  [
    { id: 'AwsSolutions-L1', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM5', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
    { id: 'AwsSolutions-IAM4', reason: 'Framework lambda not configurable and provided by the CDK L2 construct for Custom resource provider' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/CustomResourceProvider/waiter-state-machine',
  [
    { id: 'AwsSolutions-IAM5', reason: 'State machine not configurable and provided by the CDK L2 construct for Custom resource provider' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Native L2 CDK resource created by the custom resource provider framework and the retention configuration' },
    { id: 'AwsSolutions-IAM4', reason: 'Native L2 CDK resource created by the custom resource provider framework and the retention configuration' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Provider/IsCompleteHandlerLogPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The log stream name is not predictable' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  'Stack/Provider/OnEventHandlerLogPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The log stream name is not predictable' },
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