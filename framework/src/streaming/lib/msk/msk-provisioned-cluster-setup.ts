// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { CustomResource, Duration, FeatureFlags, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { S3_CREATE_DEFAULT_LOGGING_POLICY } from 'aws-cdk-lib/cx-api';

import { Construct } from 'constructs';
import { BrokerLogging, ClientAuthentication, VpcClientAuthentication } from './msk-provisioned-props-utils';
import { Utils } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * @internal
 *
 * @param scope
 * @param brokerLoggingProps
 * @returns
 */
export function monitoringSetup(
  scope: Construct,
  id: string,
  removalPolicy: RemovalPolicy,
  brokerLoggingProps?: BrokerLogging): [any, ILogGroup?] {


  const loggingBucket = brokerLoggingProps?.s3?.bucket;
  if (loggingBucket && FeatureFlags.of(scope).isEnabled(S3_CREATE_DEFAULT_LOGGING_POLICY)) {
    const stack = Stack.of(scope);
    loggingBucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new ServicePrincipal('delivery.logs.amazonaws.com'),
      ],
      resources: [
        loggingBucket.arnForObjects(`AWSLogs/${stack.account}/*`),
      ],
      actions: ['s3:PutObject'],
      conditions: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control',
          'aws:SourceAccount': stack.account,
        },
        ArnLike: {
          'aws:SourceArn': stack.formatArn({
            service: 'logs',
            resource: '*',
          }),
        },
      },
    }));

    loggingBucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new ServicePrincipal('delivery.logs.amazonaws.com'),
      ],
      resources: [loggingBucket.bucketArn],
      actions: [
        's3:GetBucketAcl',
        's3:ListBucket',
      ],
      conditions: {
        StringEquals: {
          'aws:SourceAccount': stack.account,
        },
        ArnLike: {
          'aws:SourceArn': stack.formatArn({
            service: 'logs',
            resource: '*',
          }),
        },
      },
    }));
  }

  let brokerLogGroup: LogGroup;

  //If no logging is defined in brokerLoggingProps
  //Create a cloudwatchlog

  let createBrokerLogGroup: boolean = false;

  if (brokerLoggingProps?.cloudwatchLogGroup == undefined &&
    brokerLoggingProps?.firehoseDeliveryStreamName == undefined &&
    brokerLoggingProps?.s3 == undefined) {

    brokerLogGroup = new LogGroup(scope, 'BrokerLogGroup', {
      removalPolicy: removalPolicy,
      logGroupName: `/aws/vendedlogs/msk/${Utils.generateUniqueHash(scope, id)}`,
    });

    createBrokerLogGroup = true;
  }

  const loggingInfo = {
    BrokerLogs: {
      CloudWatchLogs: {
        Enabled: createBrokerLogGroup ? createBrokerLogGroup : brokerLoggingProps?.cloudwatchLogGroup !== undefined,
        LogGroup: createBrokerLogGroup ? brokerLogGroup!.logGroupName : brokerLoggingProps?.cloudwatchLogGroup?.logGroupName,
      },
      Firehose: {
        Enabled: brokerLoggingProps?.firehoseDeliveryStreamName !==
          undefined ? true : false,
        DeliveryStream: brokerLoggingProps?.firehoseDeliveryStreamName,
      },
      S3: {
        Enabled: loggingBucket !== undefined ? true : false,
        Bucket: loggingBucket?.bucketName,
        Prefix: brokerLoggingProps?.s3?.prefix,
      },
    },
  };

  return [loggingInfo, brokerLogGroup!];

}

/**
 * @internal
 *
 * @param clientAuthenticationProps
 * @returns
 */

export function clientAuthenticationSetup(
  clientAuthenticationProps?: ClientAuthentication):
  [any, boolean, boolean] {

  let clientAuthentication;

  let inClusterAcl: boolean = false;
  let iamAcl: boolean = false;

  if (clientAuthenticationProps?.tlsProps && clientAuthenticationProps?.saslProps?.iam) {
    clientAuthentication = {
      Sasl: { Iam: { Enabled: clientAuthenticationProps.saslProps.iam }, Scram: { Enabled: false } },
      Tls: {
        CertificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities?.map(
          (ca) => ca.certificateAuthorityArn,
        ),
        Enabled: true,
      },
    };
    inClusterAcl = true;
    iamAcl = true;
  } else if (
    clientAuthenticationProps?.tlsProps?.certificateAuthorities !== undefined
  ) {
    clientAuthentication = {
      Tls: {
        CertificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities.map(
          (ca) => ca.certificateAuthorityArn,
        ),
        Enabled: true,
      },
    };
    inClusterAcl = true;
  } else {
    clientAuthentication = {
      Sasl: { Iam: { Enabled: true }, Scram: { Enabled: false } },
    };
    iamAcl = true;
  }

  return [clientAuthentication, inClusterAcl, iamAcl];
}

/**
 * @internal
 */
export function manageCluster (
  scope :Construct,
  vpc: IVpc,
  subnetSelectionIds: string[],
  removalPolicy: RemovalPolicy,
  brokerAtRestEncryptionKey: IKey,
  clusterName: string,
  ) : DsfProvider {

  let region = Stack.of(scope).region;
  let account = Stack.of(scope).account;
  let partition = Stack.of(scope).partition;

  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        `arn:${partition}:kafka:${region}:${account}:cluster/${clusterName}/*`,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:CreateClusterV2'],
      resources: [
       '*',
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:DeleteCluster'],
      resources: [
       `arn:${partition}:kafka:${region}:${account}:cluster/${clusterName}/`,
      ],
    }),
    new PolicyStatement({
      actions: ['kms:CreateGrant', 'kms:DescribeKey'],
      resources: [
        brokerAtRestEncryptionKey.keyArn,
      ],
    }),
    new PolicyStatement({
      actions: ['ec2:DescribeRouteTables', 'ec2:DescribeSubnets'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'ec2:Region': [
            Stack.of(scope).region,
          ],
        },
      },
    }),
    new PolicyStatement({
      actions: [ 'iam:AttachRolePolicy', 'iam:CreateServiceLinkedRole', 'iam:PutRolePolicy' ],
      resources: ['*'],
    }),
    new PolicyStatement({
      actions: [ 
        'ec2:DescribeVpcs', 
        'ec2:DescribeVpcEndpoints', 
        'ec2:DescribeVpcAttribute', 
        'ec2:DescribeSecurityGroups', 
        'ec2:DeleteVpcEndpoints',
        'ec2:CreateVpcEndpoint',
        'ec2:CreateTags',
    ],
      resources: ['*'],
    }),
    new PolicyStatement({
      actions: [
        'acm-pca:GetCertificateAuthorityCertificate'
      ],
      resources: ['*'],
    }),
    new PolicyStatement({
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          "iam:PassedToService": "kafka.amazonaws.com"
        }
      }
    }),
    new PolicyStatement({
      actions: [
        "logs:CreateLogDelivery",
    		"logs:GetLogDelivery",
    		"logs:UpdateLogDelivery",
    		"logs:DeleteLogDelivery",
    		"logs:ListLogDeliveries",
    		"logs:PutResourcePolicy",
    		"logs:DescribeResourcePolicies",
    		"logs:DescribeLogGroups",
    		"S3:GetBucketPolicy",
    		"firehose:TagDeliveryStream"
      ],
      resources: ['*'],
    }),
  ];

  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'ManageClusterLambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for managing MSK cluster',
  });

  let securityGroupUpdateConnectivity = new SecurityGroup(scope, 'ManageClusterLambdaSecurityGroup', {
    vpc: vpc,
    allowAllOutbound: true,
  });

  const vpcPolicyLambda: ManagedPolicy = getVpcPermissions(scope,
    securityGroupUpdateConnectivity,
    subnetSelectionIds,
    'vpcPolicyLambdaManageCluster');

  let roleUpdateConnectivityLambda = new Role(scope, 'ManageClusterLambdaExecutionRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  roleUpdateConnectivityLambda.addManagedPolicy(lambdaExecutionRolePolicy);
  roleUpdateConnectivityLambda.addManagedPolicy(vpcPolicyLambda);

  const logGroupUpdateConnectivityLambda = createLogGroup(scope, 'ManageClusterLambdaLogGroup', removalPolicy);

  logGroupUpdateConnectivityLambda.grantWrite(roleUpdateConnectivityLambda);

  const provider = new DsfProvider(scope, 'ManageClusterProvider', {
    providerName: 'update-connectivity',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/manageCluster/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/manageCluster/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/manageCluster/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/manageCluster/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
    },
    removalPolicy,
    queryTimeout: Duration.minutes(45),
    queryInterval: Duration.minutes(1),
  });

  return provider;
}

/**
 * @internal
 */
export function updateClusterConnectivity (
  scope :Construct,
  cluster: CustomResource,
  vpc: IVpc,
  subnetSelectionIds: string[],
  removalPolicy: RemovalPolicy,
  brokerAtRestEncryptionKey: IKey,
  vpcConnectivity?: VpcClientAuthentication) : DsfProvider {

  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        cluster.getAttString('Arn'),
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:UpdateConnectivity'],
      resources: [
        cluster.getAttString('Arn'),
      ],
    }),
    new PolicyStatement({
      actions: ['kms:CreateGrant', 'kms:DescribeKey'],
      resources: [
        brokerAtRestEncryptionKey.keyArn,
      ],
    }),
    new PolicyStatement({
      actions: ['ec2:DescribeRouteTables', 'ec2:DescribeSubnets'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'ec2:Region': [
            Stack.of(scope).region,
          ],
        },
      },
    }),
  ];

  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'UpdateVpcConnectivityLambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for modifying security group for MSK zookeeper',
  });

  let securityGroupUpdateConnectivity = new SecurityGroup(scope, 'UpdateVpcConnectivityLambdaSecurityGroup', {
    vpc: vpc,
    allowAllOutbound: true,
  });

  const vpcPolicyLambda: ManagedPolicy = getVpcPermissions(scope,
    securityGroupUpdateConnectivity,
    subnetSelectionIds,
    'vpcPolicyLambdaUpdateVpcConnectivity');

  let roleUpdateConnectivityLambda = new Role(scope, 'UpdateVpcConnectivityLambdaExecutionRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  roleUpdateConnectivityLambda.addManagedPolicy(lambdaExecutionRolePolicy);
  roleUpdateConnectivityLambda.addManagedPolicy(vpcPolicyLambda);

  const logGroupUpdateConnectivityLambda = createLogGroup(scope, 'UpdateVpcConnectivityLambdaLogGroup', removalPolicy);

  logGroupUpdateConnectivityLambda.grantWrite(roleUpdateConnectivityLambda);

  const provider = new DsfProvider(scope, 'UpdateVpcConnectivityProvider', {
    providerName: 'update-connectivity',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConnectivity/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/updateConnectivity/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      environment: {
        MSK_CLUSTER_ARN: cluster.getAttString('Arn'),
        REGION: Stack.of(scope).region,
        IAM: String(vpcConnectivity?.saslProps?.iam),
        TLS: String(vpcConnectivity?.tlsProps?.tls),
      },
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConnectivity/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/updateConnectivity/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      environment: {
        MSK_CLUSTER_ARN: cluster.getAttString('Arn'),
        REGION: Stack.of(scope).region,
        IAM: String(vpcConnectivity?.saslProps?.iam),
        TLS: String(vpcConnectivity?.tlsProps?.tls),
      },
    },
    vpc: vpc,
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
    securityGroups: [securityGroupUpdateConnectivity],
    removalPolicy,
    queryTimeout: Duration.minutes(45),
    queryInterval: Duration.seconds(30),
  });

  return provider;
}

export function getVpcPermissions(scope: Construct, securityGroup: ISecurityGroup, subnets: string[], id: string): ManagedPolicy {

  const region = Stack.of(scope).region;
  const account = Stack.of(scope).account;
  const partition = Stack.of(scope).partition;

  const securityGroupArn = `arn:${partition}:ec2:${region}:${account}:security-group/${securityGroup.securityGroupId}`;
  const subnetArns = subnets.map(s => `arn:${partition}:ec2:${region}:${account}:subnet/${s}`);

  const lambdaVpcPolicy = new ManagedPolicy(scope, id, {
    statements: [
      new PolicyStatement({
        actions: [
          'ec2:DescribeNetworkInterfaces',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': region,
          },
        },
      }),
      new PolicyStatement({
        actions: [
          'ec2:DeleteNetworkInterface',
          'ec2:AssignPrivateIpAddresses',
          'ec2:UnassignPrivateIpAddresses',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
        conditions: {
          StringEqualsIfExists: {
            'ec2:Subnet': subnetArns,
          },
        },
      }),
      new PolicyStatement({
        actions: [
          'ec2:CreateNetworkInterface',
        ],
        effect: Effect.ALLOW,
        resources: [
          `arn:${partition}:ec2:${region}:${account}:network-interface/*`,
        ].concat(subnetArns, securityGroupArn),
      }),
    ],
  });
  return lambdaVpcPolicy;
}

export function createLogGroup(scope: Construct, id: string, removalPolicy: RemovalPolicy): ILogGroup {

  const logGroup: LogGroup = new LogGroup(scope, id, {
    retention: RetentionDays.ONE_WEEK,
    removalPolicy: removalPolicy,
  });

  return logGroup;
}

