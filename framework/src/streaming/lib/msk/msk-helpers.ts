// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { RemovalPolicy, Arn, ArnFormat } from 'aws-cdk-lib';
import { SecurityGroup, IVpc, ISecurityGroup, CfnSecurityGroupIngress, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IPrincipal, IRole, ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { CfnCluster, CfnClusterPolicy, CfnServerlessCluster } from 'aws-cdk-lib/aws-msk';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DsfProvider } from '../../../utils/lib/dsf-provider';


export function addClusterPolicy (
  scope: Construct,
  policy: PolicyDocument,
  id: string,
  cluster: CfnServerlessCluster | CfnCluster): CfnClusterPolicy {


  let validateForResourcePolicy: string [] = policy.validateForResourcePolicy();

  if (validateForResourcePolicy.length) {
    console.log(validateForResourcePolicy.length);
    throw new Error(`Error validating Policy document ${validateForResourcePolicy.join('\n')}`);
  }

  const cfnClusterPolicy = new CfnClusterPolicy(scope, id, {
    clusterArn: cluster.attrArn,
    policy: policy.toJSON(),
  });

  cfnClusterPolicy.addDependency(cluster);

  return cfnClusterPolicy;

}

function parseMskArn(stringArn: string): { partition: string; region: string; account: string; clusterNameUuid: string } {

  // We are using this ARN format as a workaround to extract both MSK cluster name and MSK cluster UUID
  const arn = Arn.split(stringArn, ArnFormat.SLASH_RESOURCE_NAME);

  let clusterNameUuid: string;

  if ( stringArn.includes('Token[TOKEN')) {
    clusterNameUuid = `${arn.resourceName!}/${Arn.split(stringArn, ArnFormat.SLASH_RESOURCE_SLASH_RESOURCE_NAME).resourceName!}`;
  } else {
    clusterNameUuid = Arn.split(stringArn, ArnFormat.SLASH_RESOURCE_SLASH_RESOURCE_NAME).resourceName!;

  }

  return {
    partition: arn.partition!,
    region: arn.region!,
    account: arn.account!,
    clusterNameUuid: clusterNameUuid,
  };
}

export function mskIamCrudProviderSetup(
  scope: Construct,
  removalPolicy: RemovalPolicy,
  vpc: IVpc,
  subnets: SubnetSelection,
  brokerSecurityGroup: ISecurityGroup,
  clusterArn: string,
  iamHandlerRole?: IRole,
  environmentEncryption?: IKey,
): DsfProvider {

  const { partition, region, account, clusterNameUuid } = parseMskArn(clusterArn);

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
        'kafka:GetBootstrapBrokers',
        'kafka:DescribeCluster',
        'kafka-cluster:AlterCluster',
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
        'kafka-cluster:DescribeTopicDynamicConfiguration',
        'kafka-cluster:AlterTopicDynamicConfiguration',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterNameUuid}/*`,
      ],
    }),
    new PolicyStatement({
      actions: [
        'kafka-cluster:AlterGroup',
        'kafka-cluster:DescribeGroup',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:group/${clusterNameUuid}/*`,
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
      iamRole: iamHandlerRole,
    },
    vpc,
    subnets,
    securityGroups: [lambdaProviderSecurityGroup],
    environmentEncryption: environmentEncryption,
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
  secret: ISecret,
  mtlsHandlerRole?: IRole,
  environmentEncryption?: IKey): DsfProvider {

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
      iamRole: mtlsHandlerRole,
    },
    vpc,
    subnets,
    securityGroups: [lambdaProviderSecurityGroup],
    environmentEncryption: environmentEncryption,
    removalPolicy,
  });

  provider.node.addDependency(allowMskTlsPort);

  return provider;

}

export function grantConsumeIam(topicName: string, principal: IPrincipal, clusterArn: string) {

  const { partition, region, account, clusterNameUuid } = parseMskArn(clusterArn);

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
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterNameUuid}/${topicName}`,
      ],
    }));

  principal.addToPrincipalPolicy(
    new PolicyStatement({
      actions: [
        'kafka-cluster:AlterGroup',
        'kafka-cluster:DescribeGroup',
      ],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:group/${clusterNameUuid}/*`,
      ],
    }));

}

export function grantProduceIam(topicName: string, principal: IPrincipal, clusterArn: string) {

  const { partition, region, account, clusterNameUuid } = parseMskArn(clusterArn);

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
        `arn:${partition}:kafka:${region}:${account}:topic/${clusterNameUuid}/${topicName}`,
      ],
    }));
}