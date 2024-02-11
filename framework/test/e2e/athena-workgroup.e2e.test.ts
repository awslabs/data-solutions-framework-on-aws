// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

import { TestStack } from './test-stack';
import { AthenaWorkGroup, EngineVersion } from '../../src/consumption';

/**
 * E2E test for AthenaWorkGroup
 * @group e2e/consumption/athena-workgroup
 */

jest.setTimeout(6000000);
const testStack = new TestStack('AthenaWorkGroupTestStack');
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// Create Athena WorkGroup with default values
const athenaWorkGroup = new AthenaWorkGroup(stack, 'ExampleAthenaWorkGroup', {
  name: 'example-athena-wg',
  resultLocationPrefix: 'example-athena-wg/',
  removalPolicy: RemovalPolicy.DESTROY,
});

// Create Athena WorkGroup with PySpark query engine
const athenaWorkGroupSpark = new AthenaWorkGroup(stack, 'ExampleAthenaWorkGroupSpark', {
  name: 'example-athena-spark-wg',
  resultLocationPrefix: 'example-athena-spark-wg/',
  engineVersion: EngineVersion.PYSPARK_V3,
  removalPolicy: RemovalPolicy.DESTROY,
});

const role = new Role(stack, 'AthenaTestPrincipal', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});
athenaWorkGroup.grantRunQueries(role);

new CfnOutput(stack, 'AthenaWorkGroup', {
  value: athenaWorkGroup.workGroupName,
  exportName: 'WorkGroupName',
});

new CfnOutput(stack, 'AthenaWorkGroupSpark', {
  value: athenaWorkGroupSpark.workGroup.attrWorkGroupConfigurationEngineVersionEffectiveEngineVersion,
  exportName: 'AthenaWorkGroupSparkEngine',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Database in data catalog is created', async() => {
  expect(deployResult.AthenaWorkGroup).toContain('example-athena-wg');
  expect(deployResult.AthenaWorkGroupSpark).toContain('PySpark engine version 3');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);