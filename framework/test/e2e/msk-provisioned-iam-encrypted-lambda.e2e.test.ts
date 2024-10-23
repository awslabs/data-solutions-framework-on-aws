// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for MSK provisioned - IAM auth
 *
 * @group e2e/streaming/msk-provisioned-iam-auth
 */

import * as cdk from 'aws-cdk-lib';
import { Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TestStack } from './test-stack';
import { Authentication, MSK_DEFAULT_VERSION, MskProvisioned } from '../../src/streaming/lib/msk';
import { Utils } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('MskProvisionedIamTestStack', app);
const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: `cluster${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  kafkaVersion: MSK_DEFAULT_VERSION,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  environmentEncryption: new Key(stack, 'CustomKey', {
    description: 'Custom KMS key for Lambdas environment variables encryption',
  }),
});

msk.setTopic('topicProvisioned', Authentication.IAM, {
  topic: 'provisioned',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

const cluterPolicy = new PolicyDocument(
  {
    statements: [
      new PolicyStatement ({
        actions: [
          'kafka:CreateVpcConnection',
          'kafka:GetBootstrapBrokers',
          'kafka:DescribeClusterV2',
        ],
        resources: [msk.cluster.attrArn],
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal('firehose.amazonaws.com')],
      }),
    ],
  },
);

msk.addClusterPolicy(cluterPolicy, 'cluterPolicy');

new cdk.CfnOutput(stack, 'MskProvisionedCluster', {
  value: msk.cluster.attrArn,
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