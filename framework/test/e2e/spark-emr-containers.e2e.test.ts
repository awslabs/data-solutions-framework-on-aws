// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for SparkContainersRunime
 *
 * @group e2e/processing/spark-emr-containers
 */

import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { TestStack } from './test-stack';
import { SparkEmrContainersJob, SparkEmrContainersRuntime } from '../../src/processing';
import { Utils } from '../../src/utils';


jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('SparkContainersTestStack', app);
const { stack } = testStack;

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const kubectlLayer = new KubectlV27Layer(stack, 'kubectlLayer');
const eksAdminRole = Role.fromRoleArn(stack, 'EksAdminRole', `arn:aws:iam::${stack.account}:role/role-name-with-path`);

const randomName = Utils.generateUniqueHash(stack, cdk.Stack.of(stack).stackName.slice(0, 5));

// creation of the construct(s) under test
const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(stack, {
  eksClusterName: randomName,
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
  name: `e2etest${randomName}`,
  createNamespace: true,
  eksNamespace: 'e2etestns',
});

const execRole = emrEksCluster.createExecutionRole(stack, 'ExecRole', s3ReadPolicy, 'e2ens', `s3ReadExecRole${randomName}`);

const logBucket = new Bucket(stack, 'Bucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const interactiveEndpoint = emrEksCluster.addInteractiveEndpoint(stack, 'addInteractiveEndpoint4', {
  virtualClusterId: virtualCluster.attrId,
  managedEndpointName: 'e2e',
  executionRole: execRole,
});

const job = new SparkEmrContainersJob(stack, 'Job', {
  name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
  executionRole: execRole,
  virtualClusterId: virtualCluster.attrId,
  s3LogBucket: logBucket,
  s3LogPrefix: 'monitoring-logs',
  sparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
  sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
});

new cdk.CfnOutput(stack, 'virtualClusterArn', {
  value: virtualCluster.attrArn,
});

new cdk.CfnOutput(stack, 'interactiveEndpointArn', {
  value: interactiveEndpoint.getAttString('arn'),
});

new cdk.CfnOutput(stack, 'SparkJobStateMachineSimple', {
  value: job.stateMachine!.stateMachineArn,
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Containers runtime created successfully', async () => {
  // THEN
  expect(deployResult.virtualClusterArn).toContain('arn');
  expect(deployResult.SparkJobStateMachineSimple).toContain('arn:aws:states:');
  expect(deployResult.interactiveEndpointArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);
