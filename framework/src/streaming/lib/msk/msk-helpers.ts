// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Arn, ArnFormat } from 'aws-cdk-lib';
import { SecurityGroup, IVpc, ISecurityGroup, CfnSecurityGroupIngress, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';


/**
 * Properties for the `MskTopic`
 * As defined in `ITopicConfig` in [KafkaJS](https://kafka.js.org/docs/admin) SDK
 */
export interface MskTopic {
  readonly topic: string;
  readonly numPartitions?: number; // default: -1 (uses broker `num.partitions` configuration)
  readonly replicationFactor?: number; // default: -1 (uses broker `default.replication.factor` configuration)
  readonly replicaAssignment?: {[key: string]: any}[]; // Example: [{ partition: 0, replicas: [0,1,2] }] - default: []
  readonly configEntries?: {[key: string]: any}[]; // Example: [{ name: 'cleanup.policy', value: 'compact' }] - default: []
}

function parseMskArn(stringArn: string): { partition: string; region: string; account: string; clusterName: string; clusterUuid: string } {

  // We are using this ARN format as a workaround to extract both MSK cluster name and MSK cluster UUID
  const arn = Arn.split(stringArn, ArnFormat.SLASH_RESOURCE_SLASH_RESOURCE_NAME);

  return {
    partition: arn.partition!,
    region: arn.region!,
    account: arn.account!,
    clusterName: arn.resource,
    clusterUuid: arn.resourceName!,
  };
}

export function mskIamCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  subnets: SubnetSelection,
  brokerSecurityGroup: ISecurityGroup,
  clusterArn: string): DsfProvider {

  const { partition, region, account, clusterName, clusterUuid } = parseMskArn(clusterArn);

  const lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'MskIamSecurityGroup', {
    vpc,
  });

  //Allow only the security group of lambda to broker
  const allowMskIamPort = new CfnSecurityGroupIngress(scope, 'AllowMskIamPortIngress', {
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
        'kafka:GetBootstrapBrokers',
        'kafka:DescribeClusterV2',
        'kafka:CreateVpcConnection',
      ],
      resources: [
        clusterArn,
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
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterName}/${clusterUuid}/*`,
      ],
    }),
    new PolicyStatement({
      actions: [
        'kafka-cluster:AlterGroup',
        'kafka-cluster:DescribeGroup',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:group/${clusterName}/${clusterUuid}/*`,
      ],
    }),
  ];


  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'MskIamProviderPolicy', {
    statements: lambdaPolicy,
  });

  const provider = new DsfProvider(scope, 'MskIamProvider', {
    providerName: 'msk-iam-provider',
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
    vpc,
    subnets,
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
  subnets: SubnetSelection,
  brokerSecurityGroup: ISecurityGroup,
  clusterArn: string,
  secret: ISecret): DsfProvider {

  let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, 'MskAclSecurityGroup', {
    vpc,
  });

  // Allow only the security group of lambda to broker
  const allowMskTlsPort = new CfnSecurityGroupIngress(scope, 'AllowMskTlsPortIngress', {
    groupId: brokerSecurityGroup.securityGroupId,
    description: 'Allow MSK TLS Ports',
    ipProtocol: 'tcp',
    fromPort: 9094,
    toPort: 9094,
    sourceSecurityGroupId: lambdaProviderSecurityGroup.securityGroupId,
  });

  if (!secret.secretFullArn) {
    throw new Error('Secret need to be in full arn format, use "Secret.fromSecretCompleteArn" method');
  }

  // The policy allowing the MskTopic custom resource to create call Msk for CRUD operations on topic // GetBootstrapBrokers
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

  // Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'MskAclProviderPolicy', {
    statements: lambdaPolicy,
  });

  const provider = new DsfProvider(scope, 'MskAclProvider', {
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
    vpc,
    subnets,
    securityGroups: [lambdaProviderSecurityGroup],
    removalPolicy,
  });

  provider.node.addDependency(allowMskTlsPort);

  return provider;

}

export function grantConsumeIam(topicName: string, principal: IPrincipal, clusterArn: string) {

  const { partition, region, account, clusterName, clusterUuid } = parseMskArn(clusterArn);

  principal.addToPrincipalPolicy(new PolicyStatement({
    actions: [
      'kafka-cluster:Connect',
    ],
    resources: [
      clusterArn,
    ],
  }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:ReadData',
        'kafka-cluster:DescribeTopic',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterName}/${clusterUuid}/${topicName}`,
      ],
    }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:AlterGroup',
        'kafka-cluster:DescribeGroup',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:group/${clusterName}/${clusterUuid}/*`,
      ],
    }));

}

export function grantProduceIam(topicName: string, principal: IPrincipal, clusterArn: string) {

  const { partition, region, account, clusterName, clusterUuid } = parseMskArn(clusterArn);

  principal.addToPrincipalPolicy(new PolicyStatement({
    actions: [
      'kafka-cluster:Connect',
      'kafka-cluster:WriteDataIdempotently',
    ],
    resources: [
      clusterArn,
    ],
  }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:WriteData',
        'kafka-cluster:DescribeTopic',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterName}/${clusterUuid}/${topicName}`,
      ],
    }));
}