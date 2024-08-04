// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Nag for Spark runtime EMR Containers
 *
 * @group unit/best-practice/spark-runtime-containers
 */

import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { SparkEmrContainersRuntime } from '../../../../src/processing';

const app = new App();
const emrEksClusterStack = new Stack(app, 'nagStack');

const kubectlLayer = new KubectlV30Layer(emrEksClusterStack, 'kubectlLayer');

const adminRole = Role.fromRoleArn(emrEksClusterStack, 'AdminRole', 'arn:aws:iam::123445678901:role/eks-admin');

const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
  eksAdminRole: adminRole,
  publicAccessCIDRs: ['10.0.0.0/32'],
  kubectlLambdaLayer: kubectlLayer,
  vpcCidr: '10.0.0.0/16',
});

emrEksCluster.addEmrVirtualCluster(emrEksClusterStack, {
  name: 'test',
});

const virtualCluster = emrEksCluster.addEmrVirtualCluster(emrEksClusterStack, {
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

const execRole = emrEksCluster.createExecutionRole(emrEksClusterStack, 'test', policy, 'nons', 'myExecRole');

emrEksCluster.addInteractiveEndpoint(emrEksClusterStack, 'interactiveSession', {
  virtualClusterId: virtualCluster.attrId,
  managedEndpointName: 'interactiveSession',
  executionRole: execRole,
});

Aspects.of(emrEksClusterStack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/Ec2InstanceNodeGroupRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'The use of Managed policies is a must for EKS nodes' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/AwsNodeRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'The use of Managed policies is a must for EKS nodes' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/EksCluster/KubectlHandlerRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'the use of a managed policy is inherited from the L2 construct' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/AssetBucket/Resource', [
  { id: 'AwsSolutions-S1', reason: 'Access log is not necessary for this bucket, holds only assets supporting emr on eks jobs like podtemplate' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/nagStackEksClusterE556AA2A-AlbController/alb-sa/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'IAM policy provided by the controller for ALB' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/EbsCsiDriverPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used due resources defined at runtime, TBAC is used when possible' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/testExecutionRole/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used for test execution role' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/KarpenterInterruptionQueue/Resource', [
  { id: 'AwsSolutions-SQS3', reason: 'DLQ not needed, data is transient' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/EksCluster/Resource/Resource/Default', [
  { id: 'AwsSolutions-EKS1', reason: 'Public API is limited by a Security group, the CIDR is provided by the user' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/EksCluster/Resource/CreationRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Role is scoped by TBAC or resources, wild card used with list and get' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/EksCluster/karpenterServiceAccount/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Role is scoped by TBAC or resources, wild card used with list and get' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/EksCluster/Role/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'the use of a managed policy is inherited from the L2 construct' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/S3BucketDeploymentPolicy/Resource', [
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

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/IsCompleteHandler/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onTimeout/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-isComplete/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/framework-onEvent/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/OnEventHandler/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/Resource', [
  { id: 'AwsSolutions-IAM4', reason: 'managed policy used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, 'nagStack/DataPlatform/S3BucketDeploymentRole/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'wild card used by L2 resource to copy data, the policy is scoped to the resource' },
]);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, '/nagStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/Resource', [
  { id: 'AwsSolutions-L1', reason: 'unable to modify the runtime provided by L2 construct' },
]);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole',
  [
    { id: 'AwsSolutions-IAM4', reason: 'LogRetention from the custom resource framework in CDK' },
    { id: 'AwsSolutions-IAM5', reason: 'LogRetention from the custom resource framework in CDK' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/InteractiveSessionProvider/CustomResourceProvider/framework-onEvent/Resource',
  [
    { id: 'AwsSolutions-IAM4', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-IAM5', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-L1', reason: 'Custom Resource provider from the CDK framework' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/InteractiveSessionProvider/CleanUpProvider',
  [
    { id: 'AwsSolutions-IAM4', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-IAM5', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-L1', reason: 'Custom Resource provider from the CDK framework' },
  ],
  true,
);


NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/LambdaExecutionRolePolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Policy attached to the lambda handling the CR for interactive endpoint' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/InteractiveSessionProvider/VpcPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Inherited from DsfProvider and used to clean up the ENIs' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  [
    'nagStack/InteractiveSessionProvider/CustomResourceProvider/framework-isComplete',
    'nagStack/InteractiveSessionProvider/CustomResourceProvider/framework-onTimeout',
  ],
  [
    { id: 'AwsSolutions-IAM4', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-IAM5', reason: 'Custom Resource provider from the CDK framework' },
    { id: 'AwsSolutions-L1', reason: 'Custom Resource provider from the CDK framework' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  emrEksClusterStack,
  'nagStack/InteractiveSessionProvider/CustomResourceProvider/waiter-state-machine',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Custom Resource provider from the CDK framework' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(emrEksClusterStack, [
  '/nagStack/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/waiter-state-machine/Resource',
  '/nagStack/InteractiveSessionProvider/CustomResourceProvider/waiter-state-machine/Resource',
], [
  { id: 'AwsSolutions-SF2', reason: 'Resource managed by L2 and not exposed as property by CDK' },
  { id: 'AwsSolutions-SF1', reason: 'Resource managed by L2 and not exposed as property by CDK' },
],
true);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(emrEksClusterStack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(emrEksClusterStack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});

