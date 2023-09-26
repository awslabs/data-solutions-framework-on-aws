// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests EMR on EKS cluster
 *
 * @group unit/emr-eks-platform/emr-eks-cluster
 */

import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import { Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EmrEksCluster } from '../../../src/processing/spark-runtime';

const emrEksClusterStack = new Stack();
const emrEksClusterStackWithEmrServiceLinkedRole = new Stack();

const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');
const kubectlLayerServiceLinkedRole = new KubectlV27Layer(emrEksClusterStackWithEmrServiceLinkedRole, 'kubectlLayer');

const emrEksCluster = EmrEksCluster.getOrCreate(emrEksClusterStack, {
  eksAdminRoleArn: 'arn:aws:iam::123445678901:role/eks-admin',
  publicAccessCIDRs: ['10.0.0.0/32'],
  createEmrOnEksServiceLinkedRole: false,
  kubectlLambdaLayer: kubectlLayer,
  vpcCidr: '10.0.0.0/16',
});

EmrEksCluster.getOrCreate(emrEksClusterStackWithEmrServiceLinkedRole, {
  eksAdminRoleArn: 'arn:aws:iam::123445678901:role/eks-admin',
  publicAccessCIDRs: ['10.0.0.0/32'],
  createEmrOnEksServiceLinkedRole: true,
  kubectlLambdaLayer: kubectlLayerServiceLinkedRole,
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

emrEksCluster.createExecutionRole(emrEksClusterStack, 'test', policy, 'default', 'myExecRole');

const templateEmrEksClusterStack = Template.fromStack(emrEksClusterStack);
const emrEksClusterServiceLinkedRole = Template.fromStack(emrEksClusterStackWithEmrServiceLinkedRole);


test('EKS cluster created with correct version and name', () => {
  // THEN
  templateEmrEksClusterStack.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 1);

  templateEmrEksClusterStack.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
    Config: Match.objectLike({
      version: '1.27',
      name: 'data-platform',
    }),
  });
});


test('Test for emr-containers service linked role', () => {
  // THEN
  emrEksClusterServiceLinkedRole.hasResourceProperties('AWS::IAM::ServiceLinkedRole', {
    AWSServiceName: 'emr-containers.amazonaws.com',
  });
});

test('EKS VPC should be tagged', () => {
  // THEN
  templateEmrEksClusterStack.hasResourceProperties('AWS::EC2::VPC', {
    Tags: Match.arrayWith([
      Match.objectLike({
        Key: 'for-use-with-amazon-emr-managed-policies',
        Value: 'true',
      }),
    ]),
  });
});

test('EKS is used with Custom VPC CIDR', () => {
  // THEN
  templateEmrEksClusterStack.hasResourceProperties('AWS::EC2::VPC', {
    CidrBlock: '10.0.0.0/16',
  });
});

test('EKS should have at least 1 private subnet with tags', () => {
  // THEN
  templateEmrEksClusterStack.hasResourceProperties('AWS::EC2::Subnet', {
    Tags: Match.arrayWith([
      Match.objectLike({
        Key: 'aws-cdk:subnet-type',
        Value: 'Private',
      }),
      Match.objectLike({
        Key: 'for-use-with-amazon-emr-managed-policies',
        Value: 'true',
      }),
    ]),
  });
});

test('EKS should have a helm chart for deploying the cert manager', () => {
  templateEmrEksClusterStack.hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
    Chart: 'cert-manager',
    Repository: 'https://charts.jetstack.io',
    Namespace: 'cert-manager',
  });
});

test('EKS should have a helm chart for deploying the AWS load balancer controller', () => {
  templateEmrEksClusterStack.hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
    Chart: 'aws-load-balancer-controller',
    Repository: 'https://aws.github.io/eks-charts',
    Namespace: 'kube-system',
  });
});

test('EKS cluster should have the default Nodegroups', () => {
  templateEmrEksClusterStack.resourceCountIs('AWS::EKS::Nodegroup', 1);

  templateEmrEksClusterStack.hasResourceProperties('AWS::EKS::Nodegroup', {
    AmiType: 'BOTTLEROCKET_x86_64',
    InstanceTypes: ['t3.medium'],
    Labels: {
      role: 'tooling',
    },
    ScalingConfig: {
      DesiredSize: 2,
      MaxSize: 2,
      MinSize: 2,
    },
    Tags: Match.objectLike({
      'aws-data-solutions-fwk:owned': 'true',
    }),
  });

});

test('EMR virtual cluster should be created with proper configuration', () => {
  templateEmrEksClusterStack.hasResourceProperties('AWS::EMRContainers::VirtualCluster', {
    ContainerProvider: Match.objectLike({
      Type: 'EKS',
      Info: Match.objectLike({
        EksInfo: {
          Namespace: 'default',
        },
      }),
    }),
    Name: 'test',
  });
});

test('Execution role policy should be created with attached policy', () => {
  templateEmrEksClusterStack.hasResourceProperties('AWS::IAM::ManagedPolicy', {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: 's3:GetObject',
          Effect: 'Allow',
          Resource: 'arn:aws:s3:::aws-data-analytics-workshop',
        }),
      ]),
    }),
  });
});
