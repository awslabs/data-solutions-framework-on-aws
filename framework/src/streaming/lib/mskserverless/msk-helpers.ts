// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, IVpc, Port } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export function mskCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  mskCluster: CfnServerlessCluster,
  lambdaSecurityGroup: SecurityGroup) : DsfProvider {

  let account = Stack.of(scope).account;
  let region = Stack.of(scope).region;
  let clusterName = mskCluster.clusterName;

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
    vpc,
  });

  lambdaSecurityGroup.addIngressRule(lambdaProviderSecurityGroup, Port.allTcp(), 'Allow lambda to access MSK cluster');

  //The policy allowing the managed endpoint custom resource to create call the APIs for managed endpoint
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
        'kafka-cluster:*Topic*',
        'kafka-cluster:WriteData',
        'kafka-cluster:ReadData',
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


  //Policy to allow lambda access to cloudwatch logs
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for emr containers CR to create managed endpoint',
  });

  const provider = new DsfProvider(scope, 'MskCrudProvider', {
    providerName: 'msk-crud-provider',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/index.mjs'),
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
      depsLockFilePath: path.join(__dirname, './resources/lambdas/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/index.mjs'),
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