// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests AthenaWorkgroup
 *
 * @group unit/best-practice/athena/use-athena-workgroup
 */


import { App, Aspects, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { AthenaWorkGroup } from '../../../../src/consumption';

const app = new App();
const stack = new Stack(app, 'Stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const athenaWorkGroup = new AthenaWorkGroup(stack, 'athenaWgDefault', {
  name: 'test-athena-wg',
  resultLocationPrefix: 'test-athena-wg',
  removalPolicy: RemovalPolicy.RETAIN,
});

const testPrincipal = new Role(stack, 'athenaWgTestPrincipal', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
  roleName: 'testAthenaPrincipal',
});

athenaWorkGroup.grantRunQueries(testPrincipal);

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/athenaWgTestPrincipal',
  [{
    id: 'AwsSolutions-IAM5',
    reason: 'Permissions provided by the `grantRead()` and `grantWrite()`method of the `Bucket` L2 construct',
    appliesTo: [
      'Action::s3:GetBucket*',
      'Action::s3:GetObject*',
      'Action::s3:List*',
      'Action::s3:DeleteObject*',
      'Action::s3:Abort*',
    ],
  }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/athenaWgTestPrincipal',
  [{
    id: 'AwsSolutions-IAM5',
    reason: 'Permission to run queries in specific Workgroup, see: https://docs.aws.amazon.com/athena/latest/ug/example-policies-workgroup.html#example3-user-access',
    appliesTo: [
      'Resource::*',
    ],
  }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/athenaWgTestPrincipal',
  [{
    id: 'AwsSolutions-IAM5',
    reason: 'Permissions provided by the `grantEncryptDecrypt()` method of the `Bucket` L2 construct',
    appliesTo: [
      'Action::kms:ReEncrypt*',
      'Action::kms:GenerateDataKey*',
    ],
  }],
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
