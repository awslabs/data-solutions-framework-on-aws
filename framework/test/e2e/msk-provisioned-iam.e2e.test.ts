// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for MSK provisioned - IAM auth
 *
 * @group e2e/streaming/msk-provisioned-iam-auth
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { Authentitcation, MSK_DEFAULT_VERSION, MskProvisioned } from '../../src/streaming/lib/msk';
import { Utils } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('MskProvisionedTestStack', app);
const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: `cluster${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  kafkaVersion: MSK_DEFAULT_VERSION,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

msk.setTopic(stack, 'topicProvisioned', Authentitcation.IAM, {
  topic: 'provisioned',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

new cdk.CfnOutput(stack, 'MskProvisionedCluster', {
  value: msk.cluster.getAttString('Arn'),
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('MSK provisioned successfully', async () => {
  // THEN
  expect(deployResult.MskProvisionedCluster).toContain('arn:aws:kafka:');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);