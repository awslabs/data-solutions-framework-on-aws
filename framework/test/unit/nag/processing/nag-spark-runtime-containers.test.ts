// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Nag for Spark runtime EMR Containers
 *
 * @group unit/best-practice/spark-runtime-containers
 */

import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { SparkEmrContainersRuntime } from '../../../../src/processing';

const app = new App();
const emrEksClusterStack = new Stack(app, 'nagStack');

const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');

const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
  eksAdminRoleArn: 'arn:aws:iam::123445678901:role/eks-admin',
  publicAccessCIDRs: ['10.0.0.0/32'],
  kubectlLambdaLayer: kubectlLayer,
  vpcCidr: '10.0.0.0/16',
});

emrEksCluster.addEmrVirtualCluster(emrEksClusterStack, {
  name: 'test',
});

emrEksCluster.addEmrVirtualCluster(emrEksClusterStack, {
  name: 'nons',
  createNamespace: true,
  eksNamespace: 'nons',
});

const policy = new ManagedPolicy(emrEksClusterStack, 'testPolicy', {
  document: new PolicyDocument({
    statements: [
      new PolicyStatement({
        resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
        actions: ['s3:GetObject'],
      }),
    ],
  }),
});

emrEksCluster.createExecutionRole(emrEksClusterStack, 'test', policy, 'nons', 'myExecRole');

Aspects.of(emrEksClusterStack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/ec2InstanceNodeGroupRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'The use of Managed policies is a must for EKS nodes' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/awsNodeRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'The use of Managed policies is a must for EKS nodes' },
]);


NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platformCluster/KubectlHandlerRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'the use of a managed policy is inherited from the L2 construct' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platform/assetBucket/Resource', [
  { id: 'AwsSolutions-S1', reason: 'Access log is not necessary for this bucket, holds only assets supporting emr on eks jobs like podtemplate' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/nagStackdataplatformCluster69A9FDB8-AlbController/alb-sa/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'IAM policy provided by the controller for ALB' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/IamPolicyEbsCsiDriverIAMPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used due resources defined at runtime, TBAC is used when possible' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/testExecutionRole/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used for test execution role' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/karpenterInterruptionQueue/Resource', [
  { id: 'AwsSolutions-SQS3', reason: 'DLQ not needed, data is transient' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platformCluster/Resource/Resource/Default', [
  { id: 'AwsSolutions-EKS1', reason: 'Public API is limited by a Security group, the CIDR is provided by the user' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platformCluster/Resource/CreationRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Role is scoped by TBAC or resources, wild card used with list and get' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platformCluster/karpenterServiceAccount/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Role is scoped by TBAC or resources, wild card used with list and get' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platformCluster/Role/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'the use of a managed policy is inherited from the L2 construct' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/data-platform/s3BucketDeploymentPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Wild card is used because resources are created at runtime, they cannot be scoped at synth' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/OnEventHandler/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/IsCompleteHandler/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onEvent/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onEvent/ServiceRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-isComplete/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-isComplete/ServiceRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onTimeout/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/waiter-state-machine/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'unable to modify the role of the step function' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.KubectlProvider/Handler/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource' },
]);


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(emrEksClusterStack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(emrEksClusterStack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  expect(errors).toHaveLength(0);
});

