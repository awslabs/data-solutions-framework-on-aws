// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for the KafkaApi construct
 *
 * @group e2e/streaming/kafka-api
 */



import { App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

import { TestStack } from './test-stack';
import { OpenSearchCluster } from '../../src/consumption/index';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('KafkaAPiTestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

new CfnOutput(stack, 'vpcArn', {
  value: domain.vpc!.vpcArn,
});


let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Containers runtime created successfully', async () => {
  // THEN
  expect(deployResult.OpenSearchArn).toContain('arn');
  expect(deployResult.masterRoleArn).toContain('arn');
  expect(deployResult.vpcArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);