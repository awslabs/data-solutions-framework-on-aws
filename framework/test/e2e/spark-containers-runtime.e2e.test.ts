// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for SparkContainersRunime
 *
 * @group e2e/processing/spark-runtime-containers
 */

import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { SparkEmrContainersRuntime } from '../../src/processing';


jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkContainersTestStack', app);
const { stack } = testStack;

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const kubectlLayer = new KubectlV27Layer(stack, 'kubectlLayer');
const eksAdminRole = Role.fromRoleArn(stack, 'EksAdminRole', `arn:aws:iam::${stack.account}:role/role-name-with-path`);

// creation of the construct(s) under test
const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(stack, {
  eksAdminRole,
  publicAccessCIDRs: ['10.0.0.0/32'],
  createEmrOnEksServiceLinkedRole: false,
  kubectlLambdaLayer: kubectlLayer,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
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

const interactiveEndpoint = emrEksCluster.addInteractiveEndpoint(stack, 'addInteractiveEndpoint4', {
  virtualClusterId: virtualCluster.attrId,
  managedEndpointName: 'e2e',
  executionRole: execRole,
});

new cdk.CfnOutput(stack, 'virtualClusterArn', {
  value: virtualCluster.attrArn,
});

new cdk.CfnOutput(stack, 'execRoleArn', {
  value: execRole.roleArn,
});

new cdk.CfnOutput(stack, 'eksClusterName', {
  value: emrEksCluster.eksCluster.clusterName,
});

new cdk.CfnOutput(stack, 'interactiveEndpointArn', {
  value: interactiveEndpoint.getAttString('arn'),
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Containers runtime created successfully', async () => {
  // THEN
  expect(deployResult.virtualClusterArn).toContain('arn');
  expect(deployResult.execRoleArn).toContain('arn');
  expect(deployResult.eksClusterName).toBe('data-platform');
  expect(deployResult.interactiveEndpointArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);
