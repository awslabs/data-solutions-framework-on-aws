// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { Duration, FeatureFlags, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CfnCluster } from 'aws-cdk-lib/aws-msk';
import { S3_CREATE_DEFAULT_LOGGING_POLICY } from 'aws-cdk-lib/cx-api';

import { Construct } from 'constructs';
import { BrokerLogging, ClientAuthentication, ClusterConfigurationInfo } from './msk-utils';
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
    brokerLogs: {
      cloudWatchLogs: {
        enabled: createBrokerLogGroup ? createBrokerLogGroup : brokerLoggingProps?.cloudwatchLogGroup !== undefined,
        logGroup: createBrokerLogGroup ? brokerLogGroup!.logGroupName : brokerLoggingProps?.cloudwatchLogGroup?.logGroupName,
      },
      firehose: {
        enabled: brokerLoggingProps?.firehoseDeliveryStreamName !==
          undefined,
        deliveryStream: brokerLoggingProps?.firehoseDeliveryStreamName,
      },
      s3: {
        enabled: loggingBucket !== undefined,
        bucket: loggingBucket?.bucketName,
        prefix: brokerLoggingProps?.s3?.prefix,
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
  [CfnCluster.ClientAuthenticationProperty, boolean, boolean] {

  let clientAuthentication;

  let inClusterAcl: boolean = false;
  let iamAcl: boolean = false;

  if (clientAuthenticationProps?.tlsProps && clientAuthenticationProps?.saslProps?.iam) {
    clientAuthentication = {
      sasl: { iam: { enabled: clientAuthenticationProps.saslProps.iam }, scram: { enabled: false } },
      tls: {
        certificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities?.map(
          (ca: any) => ca.certificateAuthorityArn,
        ),
        enabled: true,
      },
    };
    inClusterAcl = true;
    iamAcl = true;
  } else if (
    clientAuthenticationProps?.tlsProps?.certificateAuthorities
  ) {
    clientAuthentication = {
      tls: {
        certificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities.map(
          (ca: any) => ca.certificateAuthorityArn,
        ),
        enabled: true,
      },
    };
    inClusterAcl = true;
  } else {
    clientAuthentication = {
      sasl: { iam: { enabled: true }, scram: { enabled: false } },
    };
    iamAcl = true;
  }

  return [clientAuthentication, inClusterAcl, iamAcl];
}

/**
 * @internal
 */
export function updateClusterConnectivity (
  scope :Construct,
  cluster: CfnCluster,
  vpc: IVpc,
  subnetSelectionIds: string[],
  removalPolicy: RemovalPolicy,
  brokerAtRestEncryptionKey: IKey,
  placeClusterHandlerInVpc?: boolean) : DsfProvider {

  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        cluster.attrArn,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:UpdateConnectivity'],
      resources: [
        cluster.attrArn,
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

  // Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'UpdateVpcConnectivityLambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for modifying security group for MSK VPC connectivity',
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

  const provider = new DsfProvider(scope, 'UpdateVpcConnectivityProvider', {
    providerName: 'update-connectivity',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConnectivity/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/updateConnectivity/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      environment: {
        MSK_CLUSTER_ARN: cluster.attrArn,
        REGION: Stack.of(scope).region,
      },
    },
    // We are making the update a fire and forget because it would break the custom resource timeout of 1 hour
    // isCompleteHandlerDefinition: {
    //   handler: 'index.isCompleteHandler',
    //   depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConnectivity/package-lock.json'),
    //   entryFile: path.join(__dirname, './resources/lambdas/updateConnectivity/index.mjs'),
    //   managedPolicy: lambdaExecutionRolePolicy,
    //   environment: {
    //     MSK_CLUSTER_ARN: cluster.attrArn,
    //     REGION: Stack.of(scope).region,
    //   },
    // },
    vpc: placeClusterHandlerInVpc ? vpc : undefined,
    subnets: placeClusterHandlerInVpc ? vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }) : undefined,
    securityGroups: placeClusterHandlerInVpc ? [securityGroupUpdateConnectivity] : undefined,
    removalPolicy,
    // queryTimeout: Duration.minutes(59),
    // queryInterval: Duration.minutes(1),
  });

  return provider;
}


/**
 * @internal
 */
export function applyClusterConfiguration (
  scope :Construct,
  cluster: CfnCluster,
  vpc: IVpc,
  subnetSelectionIds: string[],
  removalPolicy: RemovalPolicy,
  brokerAtRestEncryptionKey: IKey,
  configuration: ClusterConfigurationInfo,
  placeClusterHandlerInVpc?: boolean) : DsfProvider {

  const setClusterConfigurationLambdaSecurityGroup = new SecurityGroup(scope, 'setClusterConfigurationLambdaSecurityGroup', {
    vpc: vpc,
    allowAllOutbound: true,
  });

  const vpcPolicyLambda: ManagedPolicy = getVpcPermissions(scope,
    setClusterConfigurationLambdaSecurityGroup,
    subnetSelectionIds,
    'vpcPolicyLambdaSetClusterConfiguration');

  const lambdaPolicy = [
    new PolicyStatement({
      actions: ['kafka:DescribeCluster'],
      resources: [
        cluster.attrArn,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:DescribeConfiguration'],
      resources: [
        configuration.arn,
      ],
    }),
    new PolicyStatement({
      actions: ['kafka:UpdateClusterConfiguration'],
      resources: [
        configuration.arn,
        cluster.attrArn,
      ],
    }),
    new PolicyStatement({
      actions: ['kms:CreateGrant', 'kms:DescribeKey'],
      resources: [
        brokerAtRestEncryptionKey.keyArn,
      ],
    }),
  ];

  //Attach policy to IAM Role
  const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'SetClusterConfigurationLambdaExecutionRolePolicy', {
    statements: lambdaPolicy,
    description: 'Policy for modifying MSK cluster configuration',
  });

  let securityGroupUpdateConnectivity = new SecurityGroup(scope, 'SetClusterConfigurationLambdaSecurityGroup', {
    vpc: vpc,
    allowAllOutbound: true,
  });

  let roleUpdateConnectivityLambda = new Role(scope, 'SetClusterConfigurationLambdaExecutionRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  roleUpdateConnectivityLambda.addManagedPolicy(lambdaExecutionRolePolicy);
  roleUpdateConnectivityLambda.addManagedPolicy(vpcPolicyLambda);

  const provider = new DsfProvider(scope, 'SetClusterConfigurationProvider', {
    providerName: 'set-cluster-configuration',
    onEventHandlerDefinition: {
      handler: 'index.onEventHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConfiguration/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/updateConfiguration/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      environment: {
        REGION: Stack.of(scope).region,
      },
    },
    isCompleteHandlerDefinition: {
      handler: 'index.isCompleteHandler',
      depsLockFilePath: path.join(__dirname, './resources/lambdas/updateConfiguration/package-lock.json'),
      entryFile: path.join(__dirname, './resources/lambdas/updateConfiguration/index.mjs'),
      managedPolicy: lambdaExecutionRolePolicy,
      environment: {
        REGION: Stack.of(scope).region,
      },
    },
    vpc: placeClusterHandlerInVpc ? vpc : undefined,
    subnets: placeClusterHandlerInVpc ? vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }) : undefined,
    securityGroups: placeClusterHandlerInVpc ? [securityGroupUpdateConnectivity] : undefined,
    removalPolicy,
    queryTimeout: Duration.minutes(59),
    queryInterval: Duration.minutes(1),
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

