// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for SparkJob
 *
 * @group e2e/processing/spark-emr-serverless
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { MskServerless } from '../../src/streaming/lib/msk';
import { DataVpc } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('MskServerkessTestStack', app);
const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const msk = new MskServerless(stack, 'cluster', {
  clusterName: 'e2e-cluster-serverless',
  vpcConfigs: [
    {
      subnetIds: vpc.vpc.privateSubnets.map((s) => s.subnetId),
      securityGroups: [vpc.vpc.vpcDefaultSecurityGroup],
    },
  ],
  vpc: vpc.vpc,
});


new cdk.CfnOutput(stack, 'MskServerlessCluster', {
  value: msk.mskServerlessCluster.attrArn,
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
