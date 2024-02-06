// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, IVpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../../utils/lib/dsf-provider';

export function interactiveSessionsProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  assetBucket?: IBucket) : DsfProvider {

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'interactiveEndpointCrSg', {
    vpc,
  });

  //The policy allowing the managed endpoint custom resource to create call the APIs for managed endpoint
  const lambdaPolicy = [
    new PolicyStatement({
      resources: ['*'],
      actions: ['emr-containers:DescribeManagedEndpoint'],
    }),
    new PolicyStatement({
      resources: [`arn:${Stack.of(scope).partition}:emr-containers:${Stack.of(scope).region}:${Stack.of(scope).account}:/virtualclusters/*/endpoints/*`],
      actions: [
        'emr-containers:DeleteManagedEndpoint',
      ],
      conditions: { StringEquals: { 'aws:ResourceTag/data-solutions-fwk:owned': 'true' } },
    }),
    new PolicyStatement({
      resources: [`arn:${Stack.of(scope).partition}:emr-containers:${Stack.of(scope).region}:${Stack.of(scope).account}:/virtualclusters/*`],
      actions: ['emr-containers:CreateManagedEndpoint'],
      conditions: { StringEquals: { 'aws:ResourceTag/data-solutions-fwk:owned': 'true' } },
    }),
    new PolicyStatement({
      resources: [`arn:${Stack.of(scope).partition}:emr-containers:${Stack.of(scope).region}:${Stack.of(scope).account}:/virtualclusters/*/endpoints/*`],
      actions: ['emr-containers:TagResource'],
      conditions: { StringEquals: { 'aws:RequestTag/data-solutions-fwk:owned': 'true' } },
    }),
    new PolicyStatement({
      resources: [
        `arn:aws:ec2:${Stack.of(scope).region}:${Stack.of(scope).account}:security-group-rule/*`,
        `arn:aws:ec2:${Stack.of(scope).region}:${Stack.of(scope).account}:security-group/*`,
      ],
      actions: [
        'ec2:DeleteSecurityGroup',
        'ec2:AuthorizeSecurityGroupEgress',
        'ec2:AuthorizeSecurityGroupIngress',
        'ec2:RevokeSecurityGroupEgress',
        'ec2:RevokeSecurityGroupIngress',
      ],
    }),
    new PolicyStatement({
      resources: [
        vpc.vpcArn,
        `arn:aws:ec2:${Stack.of(scope).region}:${Stack.of(scope).account}:security-group/*`,
      ],
      actions: [
        'ec2:CreateSecurityGroup',
      ],
    }),
  ];

  if (assetBucket) {
    lambdaPolicy.push(
      new PolicyStatement({
        resources: [assetBucket.bucketArn],
        actions: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
      }),
    );
  }

  //Policy to allow lambda access to cloudwatch logs
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for emr containers CR to create managed endpoint',
  });

  const provider = new DsfProvider(scope, 'InteractiveSessionProvider', {
    providerName: 'emr-containers-interactive-endpoint-provider',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/managed-endpoint/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/managed-endpoint/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/managed-endpoint/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/managed-endpoint/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
    },
    vpc: vpc ? vpc: undefined,
    subnets: vpc ? vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }) : undefined,
    securityGroups: lambdaProviderSecurityGroup ? [lambdaProviderSecurityGroup] : undefined,
    removalPolicy,
  });

  return provider;

}