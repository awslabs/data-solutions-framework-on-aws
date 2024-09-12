// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests DataZoneMskEnvironmentAuthorizer
*
* @group unit/best-practice/datazone-msk-environment-authorizer
*/


import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataZoneMskEnvironmentAuthorizer } from '../../../../src/governance';

const app = new App();
const stack = new Stack(app, 'Stack');
const DOMAIN_ID = 'aba_dc999t9ime9sss';

new DataZoneMskEnvironmentAuthorizer(stack, 'MskAuthorizer', {
  domainId: DOMAIN_ID,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/MskAuthorizer/GrantRole/Resource',
],
[
  { id: 'AwsSolutions-IAM4', reason: 'Recommended baseline policy for AWS Lambda Functions' },
  { id: 'AwsSolutions-IAM5', reason: 'Wildcard required because the MSK clusters and the IAM Roles are not known' },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/MskAuthorizer/Queue/Resource',
],
[
  { id: 'AwsSolutions-SQS3', reason: 'The SQS queue is used as a Dead Letter Queue' },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/MskAuthorizer/StateMachine/Resource',
],
[
  { id: 'AwsSolutions-SF1', reason: 'The state machine doesn\'t log ALL events to optimize costs and because Lambda Functions already log the business logic' },
  { id: 'AwsSolutions-SF2', reason: 'X-ray not required in the state machine, logging and tracing happen in the Lambda Functions' },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/MskAuthorizer/StateMachine/Role/DefaultPolicy/Resource',
],
[
  { id: 'AwsSolutions-IAM5', reason: 'Wildcard created automatically by CDK for the Step Functions role to trigger the Lambda Functions versions' },
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