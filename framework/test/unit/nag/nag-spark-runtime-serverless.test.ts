// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Nag for Spark runtime EMR Serverless
 *
 * @group unit/best-practice/spark-runtime-serverless
 */

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AccountRootPrincipal, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { AwsSolutionsChecks } from 'cdk-nag';
import { SparkEmrServerlessRuntime } from '../../../src/processing';
import { EmrRuntimeVersion } from '../../../src/utils';


const app = new App();
const stack = new Stack(app, 'Stack');

const runtimeServerless = new SparkEmrServerlessRuntime(stack, 'SparkRuntimeServerlessStack', {
  releaseLabel: EmrRuntimeVersion.V6_12,
  name: 'spark-serverless-demo',
});

const myFileSystemPolicy = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['arn:aws:s3:::bucket_name'],
  })],
});

let myTestRole = new Role (stack, 'TestRole', {
  assumedBy: new AccountRootPrincipal(),
});

const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

runtimeServerless.grantExecution(myTestRole, myExecutionRole.roleArn);


Aspects.of(stack).add(new AwsSolutionsChecks());


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  expect(errors).toHaveLength(0);
});

