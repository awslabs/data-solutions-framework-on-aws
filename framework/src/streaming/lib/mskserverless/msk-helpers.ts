// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, IVpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export function mskCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  mskCluster: CfnServerlessCluster) : DsfProvider {

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
    vpc,
  });

  //The policy allowing the managed endpoint custom resource to create call the APIs for managed endpoint
  const lambdaPolicy = [
    new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        mskCluster.attrArn,
      ],
      actions: [
        'kafka-cluster:*', //Wide permission for test
      ],
    }),
  ];

  //Policy to allow lambda access to cloudwatch logs
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for emr containers CR to create managed endpoint',
  });

  console.log(__dirname);
  console.log(path.join(__dirname, './resources/lambdas/package-lock.json'));

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
            'kafkajs'
        ]
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
            'kafkajs'
        ]
      },
    },
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  return provider;

}