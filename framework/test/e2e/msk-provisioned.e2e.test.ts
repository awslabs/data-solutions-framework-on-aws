// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for MSK provisioned - IAM auth
 *
 * @group e2e/streaming/msk-provisioned-iam-auth
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { Authentitcation, KafkaVersion, MskProvisioned } from '../../src/streaming/lib/msk';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('MskProvisionedTestStack', app);
const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: 'cluster',
  kafkaVersion: KafkaVersion.V3_4_0,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

msk.setTopic(stack, 'topic4', Authentitcation.IAM, [{
  topic: 'topic4',
  numPartitions: 1,
  replicationFactor: 1,
}], cdk.RemovalPolicy.DESTROY, false, 1500);

new cdk.CfnOutput(stack, 'MskServerlessCluster', {
  value: msk.mskProvisionedCluster.attrArn,
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('Serverless runtime created successfully', async () => {
  // THEN
  expect(deployResult.MskServerlessCluster).toContain('arn:aws:kafka:');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);