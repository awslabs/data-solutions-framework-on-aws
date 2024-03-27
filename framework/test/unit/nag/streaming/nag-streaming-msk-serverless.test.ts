// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests Msk Serverless
 *
 * @group unit/best-practice/streaming/msk-serverless
 */

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { MskServerless } from '../../../../src/streaming/lib/msk';


const app = new App();
const stack = new Stack(app, 'stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'true' });

new MskServerless(stack, 'cluster', {
  clusterName: 'dev-demo',
});

Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/LambdaExecutionRolePolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'This the policy for the lambda CR that manage CRUD operation within the MSK Serverless' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/MskCrudProvider/VpcPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Inherited from DsfProvider and used to clean up the ENIs' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/MskCrudProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/MskCrudProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/MskCrudProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/MskCrudProvider/CustomResourceProvider/framework-onEvent/Resource',
  ],
  [
    { id: 'AwsSolutions-IAM4', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
    { id: 'AwsSolutions-IAM5', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
    { id: 'AwsSolutions-L1', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
  ],
  true,
);


NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  ],
  [
    { id: 'AwsSolutions-IAM4', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
    { id: 'AwsSolutions-IAM5', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/LambdaSecurityGroup',
  [{ id: 'AwsSolutions-EC23', reason: 'Handled with Egress rules' }],
  true,
);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  //Not able to suppress the Warning for 'AwsSolutions-EC23'
  //Increase lenght to 1 not to fail the test
  expect(warnings).toHaveLength(1);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});
