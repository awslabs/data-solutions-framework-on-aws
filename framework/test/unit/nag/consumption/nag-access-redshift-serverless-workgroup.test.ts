// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Test RedshiftServerlessWorkgroup
 * @group unit/best-practice/consumption/redshift-serverless-workgroup
 */

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { RedshiftServerlessWorkgroup } from '../../../../src/consumption';

const app = new App();
const stack = new Stack(app, 'Stack');
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const workgroup = new RedshiftServerlessWorkgroup(stack, 'rs-example-workgroup', {
  workgroupName: 'test-rs-workgroup',
});

workgroup.accessData(true);
workgroup.catalogTables('rs-defaultdb');

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'CdkNagValidationFailure',
    reason: 'Intended behavior',
  },
], true);

NagSuppressions.addResourceSuppressionsByPath(stack, '/Stack/rs-example-workgroup/DefaultServerlessNamespace/RSServerlessNamespace/CustomResourcePolicy/Resource', [
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Required because namespace ID is not yet known at the time of creation.',
  },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/rs-example-workgroup/RS-Serverless-Catalog-71974586/CrawlerRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RS-Serverless-Catalog-71974586/CrawlerRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RedshiftTaggingManagedPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RSDataLambdaExecRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RSDSFDataExecutionProvider/VpcPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RSDSFDataExecutionProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RSDSFDataExecutionProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/RSDSFDataExecutionProvider/CleanUpProvider/framework-onEvent/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onEvent/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-isComplete/ServiceRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-isComplete/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onTimeout/ServiceRole/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/framework-onTimeout/Resource',
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  '/Stack/rs-example-workgroup/RSServerlessDataAPI-8ce3bd5e16a11599184268e9fa31d42ad668e910e2c72a55f9634119acc9f5fb/CustomResourceProvider/waiter-state-machine/Role/DefaultPolicy/Resource',
  '/Stack/AWS679f53fac002430cb0da5b7982bd2287/ServiceRole/Resource',
  '/Stack/AWS679f53fac002430cb0da5b7982bd2287/Resource',
], [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'Required by either CDK or DFS for flexibility',
  },
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Required by either CDK or DFS for flexibility',
  },
  {
    id: 'AwsSolutions-L1',
    reason: 'Part of CDK AWS Custom Resource Construct',
  },
]);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(JSON.stringify(errors));
  expect(errors).toHaveLength(0);
});