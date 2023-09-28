// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * E2E test for SparkServerlessRunime
 *
 * @group e2e/spark-runtime-containers
 */

import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { EmrEksCluster } from '../../src/processing';


jest.setTimeout(6000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkContainersTestStack', app);
const { stack } = testStack;

const kubectlLayer = new KubectlV27Layer(stack, 'kubectlLayer');

// creation of the construct(s) under test
const emrEksCluster = EmrEksCluster.getOrCreate(stack, {
  eksAdminRoleArn: `arn:aws:iam::${stack.account}:role/role-name-with-path`,
  publicAccessCIDRs: ['10.0.0.0/32'],
  createEmrOnEksServiceLinkedRole: false,
  kubectlLambdaLayer: kubectlLayer,
});

const s3Read = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
  })],
});

const s3ReadPolicy = new ManagedPolicy(stack, 's3ReadPolicy', {
  document: s3Read,
});

const virtualCluster = emrEksCluster.addEmrVirtualCluster(stack, {
  name: 'e2e',
  createNamespace: true,
  eksNamespace: 'e2ens',
});

const execRole = emrEksCluster.createExecutionRole(stack, 'ExecRole', s3ReadPolicy, 'e2ens', 's3ReadExecRole');

new cdk.CfnOutput(stack, 'virtualClusterArn', {
  value: virtualCluster.attrArn,
});

new cdk.CfnOutput(stack, 'execRoleArn', {
  value: execRole.roleArn,
});

new cdk.CfnOutput(stack, 'eksClusterName', {
  value: emrEksCluster.clusterName,
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 1800000);

it('Serverless runtime created successfully', async () => {
  // THEN
  expect(deployResult.virtualClusterArn).toContain('arn');
  expect(deployResult.execRoleArn).toContain('arn');
  expect(deployResult.eksClusterName).toBe('data-platform');
});

afterAll(async () => {
  await testStack.destroy();
}, 1800000);
