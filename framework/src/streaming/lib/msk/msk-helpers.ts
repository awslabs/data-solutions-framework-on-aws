// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Stack, Aws, Fn } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, IVpc, ISecurityGroup, CfnSecurityGroupIngress } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnCluster, CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export function mskIamCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  brokerSecurityGroup: ISecurityGroup,
  clusterArn: string,
  clusterName: string) : DsfProvider {

  let account = Stack.of(scope).account;
  let region = Stack.of(scope).region;

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskCrudCrSg', {
    vpc,
  });

  //Allow only the security group of lambda to broker
  const allowMskIamPort = new CfnSecurityGroupIngress(scope, 'allowMskIamPort', {
    groupId: brokerSecurityGroup.securityGroupId,
    description: 'Allow MSK IAM Ports',
    ipProtocol: 'tcp',
    fromPort: 9098,
    toPort: 9098,
    sourceSecurityGroupId: lambdaProviderSecurityGroup.securityGroupId,
  });

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
        clusterArn,
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
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  provider.node.addDependency(allowMskIamPort);
  return provider;

}

export function mskAclAdminProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  brokerSecurityGroup: ISecurityGroup,
  clusterArn: string,
  secret: ISecret) : DsfProvider {

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'mskAclAdminCr', {
    vpc,
  });

  //Allow only the security group of lambda to broker
  const allowMskTlsPort = new CfnSecurityGroupIngress(scope, 'allowMskTlsPort', {
    groupId: brokerSecurityGroup.securityGroupId,
    description: 'Allow MSK TLS Ports',
    ipProtocol: 'tcp',
    fromPort: 9094,
    toPort: 9094,
    sourceSecurityGroupId: lambdaProviderSecurityGroup.securityGroupId,
  });

  //The policy allowing the MskTopic custom resource to create call Msk for CRUD operations on topic // GetBootstrapBrokers
  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        clusterArn,
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
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  provider.node.addDependency(allowMskTlsPort);

  return provider;

}

export function grantConsumeIam (
  topicName: string,
  principal: IPrincipal,
  cluster?: CfnCluster | CfnServerlessCluster,
  clusterArn?: string) {

  let clusterUuid = undefined;
  let clusterName = undefined;
  let _clusterArn = cluster?.attrArn ?? clusterArn;

  if (cluster) {
    clusterName = Fn.select(1, Fn.split('/', cluster.attrArn));
    clusterUuid = Fn.select(2, Fn.split('/', cluster.attrArn));
  } else {
    clusterName = clusterArn?.split('/')[1];
    clusterUuid = clusterArn?.split('/')[2];
  }
  principal.addToPrincipalPolicy(new PolicyStatement({
    actions: [
      'kafka-cluster:Connect',
    ],
    resources: [
      _clusterArn!,
    ],
  }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:ReadData',
        'kafka-cluster:DescribeTopic',
      ],
      resources: [
        `arn:${Aws.PARTITION}:kafka:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/${clusterName}/${clusterUuid}/${topicName}`,
      ],
    }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:AlterGroup',
        'kafka-cluster:DescribeGroup',
      ],
      resources: [
        `arn:${Aws.PARTITION}:kafka:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/${clusterName}/${clusterUuid}/*`,
      ],
    }));

}

export function grantProduceIam (
  topicName: string,
  principal: IPrincipal,
  cluster?: CfnCluster | CfnServerlessCluster,
  clusterArn?: string) {

  let clusterUuid = undefined;
  let clusterName = undefined;
  let _clusterArn = cluster?.attrArn ?? clusterArn;

  if (cluster) {
    clusterName = Fn.select(1, Fn.split('/', cluster.attrArn));
    clusterUuid = Fn.select(2, Fn.split('/', cluster.attrArn));
  } else {
    clusterName = clusterArn?.split('/')[1];
    clusterUuid = clusterArn?.split('/')[2];
  }

  principal.addToPrincipalPolicy(new PolicyStatement({
    actions: [
      'kafka-cluster:Connect',
      'kafka-cluster:WriteDataIdempotently',
    ],
    resources: [
      _clusterArn!,
    ],
  }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:WriteData',
        'kafka-cluster:DescribeTopic',
      ],
      resources: [
        `arn:${Aws.PARTITION}:kafka:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/${clusterName}/${clusterUuid}/${topicName}`,
      ],
    }));
}