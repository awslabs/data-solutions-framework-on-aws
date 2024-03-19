// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, IVpc, Port, ISecurityGroup, Peer } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnCluster, CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export function mskCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  mskCluster: CfnServerlessCluster,
  lambdaSecurityGroup: ISecurityGroup) : DsfProvider {

  let account = Stack.of(scope).account;
  let region = Stack.of(scope).region;
  let clusterName = mskCluster.clusterName;

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
    vpc,
  });

  lambdaSecurityGroup.addIngressRule(lambdaProviderSecurityGroup, Port.allTcp(), 'Allow lambda to access MSK cluster');

  //The policy allowing the MskTopic custom resource to create call Msk for CRUD operations on topic
  const lambdaPolicy = [

    new PolicyStatement({
      actions: [
        'kafka-cluster:Connect',
        'kafka-cluster:AlterCluster',
        'kafka-cluster:DescribeCluster',
        'kafka-cluster:DescribeClusterV2',
      ],
      resources: [
        `arn:aws:kafka:${region}:${account}:cluster/${clusterName}/*`,
      ],
    }),
    new PolicyStatement({
      actions: [
        'kafka-cluster:CreateTopic',
        'kafka-cluster:DescribeTopic',
        'kafka-cluster:AlterTopic',
        'kafka-cluster:DeleteTopic',
      ],
      resources: [
        `arn:aws:kafka:${region}:${account}:topic/${clusterName}/*`,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka-cluster:AlterGroup', 'kafka-cluster:DescribeGroup'],
      resources: [
        `arn:aws:kafka:${region}:${account}:group/${clusterName}/*`,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:GetBootstrapBrokers', 'kafka:DescribeClusterV2', 'kafka:CreateVpcConnection'],
      resources: [
        mskCluster.attrArn,
      ],
    }),
  ];


  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for emr containers CR to create managed endpoint',
  });

  const provider = new DsfProvider(scope, 'MskCrudProvider', {
    providerName: 'msk-crud-provider',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/crudIam/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/crudIam/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      bundling: {
        nodeModules: [
          'aws-msk-iam-sasl-signer-js',
          'kafkajs',
        ],
      },
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/crudIam/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/crudIam/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      bundling: {
        nodeModules: [
          'aws-msk-iam-sasl-signer-js',
          'kafkajs',
        ],
      },
    },
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  return provider;

}

export function mskAclAdminProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  mskCluster: CfnCluster,
  brokerSecurityGroup: ISecurityGroup,
  secret: ISecret) : DsfProvider {

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskAclAdminCr', {
    vpc,
  });

  //We need to add the CIDR block of the VPC
  //adding the security group as a peer break the destroy
  //because the ingress rule is destroyed before before the ACLs are removed
  brokerSecurityGroup.addIngressRule(
    Peer.ipv4(vpc.vpcCidrBlock),
    Port.allTcp(),
    'Allow lambda to access MSK cluster');

  //The policy allowing the MskTopic custom resource to create call Msk for CRUD operations on topic // GetBootstrapBrokers
  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        mskCluster.attrArn,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:GetBootstrapBrokers'],
      resources: [
        '*',
      ],
    }),
    new PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        secret.secretFullArn!,
      ],
    }),
  ];


  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicymskAclAdminCr', {
    statements: lambdaPolicy,
    description: 'Policy for emr containers CR to create managed endpoint',
  });

  const provider = new DsfProvider(scope, 'MskAclAdminProvider', {
    providerName: 'msk-acl-admin-provider',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/tlsCrudAdminClient/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/tlsCrudAdminClient/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      bundling: {
        nodeModules: [
          'kafkajs',
        ],
      },
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/tlsCrudAdminClient/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/tlsCrudAdminClient/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      bundling: {
        nodeModules: [
          'kafkajs',
        ],
      },
    },
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  return provider;

}