// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests DataZoneGsrMskDataSource
*
* @group unit/best-practice/datazone-gsr-msk-data-source
*/


import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataZoneGsrMskDataSource } from '../../../../src/governance';

const app = new App();
const stack = new Stack(app, 'Stack');
const DOMAIN_ID = 'aba_dc999t9ime9sss';
const REGISTRY_NAME = 'schema-registry';
const CLUSTER_NAME = 'msk-cluster';
const PROJECT_ID = '999a99aa9aaaaa';

new DataZoneGsrMskDataSource(stack, 'DataZoneGsrMskDataSource', {
  domainId: DOMAIN_ID,
  projectId: PROJECT_ID,
  registryName: REGISTRY_NAME,
  clusterName: CLUSTER_NAME,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/DataZoneGsrMskDataSource/HandlerRole/Resource',
],
[
  { id: 'AwsSolutions-IAM4', reason: 'Recommended baseline policy for AWS Lambda Functions' },
  { id: 'AwsSolutions-IAM5', reason: 'Schemas and cluster ARNs are unknow and discovered during execution' },
  { id: 'AwsSolutions-IAM5', reason: 'SSM parameter ID is based on the schema name and discovered during execution' },
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