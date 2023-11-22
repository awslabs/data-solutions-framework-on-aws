// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Names, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { FlowLogDestination, GatewayVpcEndpoint, GatewayVpcEndpointAwsService, IVpc, IVpcEndpoint, IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, IRole, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Context } from './context';

/**
 * A network configuration created by the vpcBootstrap function.
 * @param {IVpc} vpc the vpc created by the function vpcBootstrap
 * @param {IVpcEndpoint} s3GatewayVpcEndpoint the vpc endpoint attached to the vpc the function vpcBootstrap created
 * @param {ILogGroup} vpcFlowLogLogGroup the log group used to store the vpc flow logs
 * @param {IRole} iamFlowLogRole the role used to store the vpc flow logs
*/
export interface NetworkConfiguration {
  readonly vpc: IVpc;
  readonly s3GatewayVpcEndpoint: IVpcEndpoint;
  readonly vpcFlowLogLogGroup: ILogGroup;
  readonly iamFlowLogRole: IRole;
}

/**
 * @internal
 * Create a VPC with the provided CIDR and attach to it an Amazon S3 Gateway Vpc Endpoint
 * @param {Construct} scope The scope of the stack where the VPC will be created
 * @param {string} vpcCidr The cidr for vpc
 * @param {Key} logKmsKey The KMS key used to encrypt the VPC flow log
 * @param {RemovalPolicy} vpcFlowlogRemovalPolicy The removal policy for vpc flowlog in cloudwatch log
 * @param {string} eksClusterName The name used to tag the subnet and vpc
 * @param {string} emrAppName The name used to tag the subnet and vpc
 */

export function vpcBootstrap(
  scope: Construct,
  vpcCidr: string,
  logKmsKey: IKey,
  vpcFlowlogRemovalPolicy?: RemovalPolicy,
  eksClusterName?: string,
  emrAppName?: string,
  vpcFlowLogRole?: IRole): NetworkConfiguration {

  const vpcMask = parseInt(vpcCidr.split('/')[1]);
  const smallestVpcCidr: number = 28;


  const removalPolicy = Context.revertRemovalPolicy(scope, vpcFlowlogRemovalPolicy);

  if (vpcMask > smallestVpcCidr) {
    throw new Error(`The VPC netmask should be at least 28, netmask provided is ${vpcMask}`);
  }

  // Calculate subnet masks based on VPC's mask
  const publicSubnetMask = vpcMask + 4;
  const privateSubnetMask = publicSubnetMask + 2; // twice as large as public subnet

  const vpc = new Vpc(scope, 'DsfVpc', {
    ipAddresses: IpAddresses.cidr(vpcCidr),
    maxAzs: 3,
    natGateways: 3,
    subnetConfiguration: [
      {
        cidrMask: publicSubnetMask,
        name: 'Public',
        subnetType: SubnetType.PUBLIC,
      },
      {
        cidrMask: privateSubnetMask,
        name: 'Private',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    ],
  });

  //Create a loggroup name based on the purpose of the VPC, either used by emr on eks or emr serverless app
  const logGroupName = eksClusterName ? `/aws/emr-eks-vpc-flow/${eksClusterName}`:`/aws/emr-serverless-vpc/${Names.nodeUniqueId(scope.node)}` ;

  const logGroupResourceId = eksClusterName ? 'EmrEksVpcFlowLog' : 'EmrServerlessVpcFlowLog' ;

  //Create VPC flow log for the VPC
  let vpcFlowLogLogGroup = new LogGroup(scope, `${logGroupResourceId}Group`, {
    logGroupName: logGroupName,
    encryptionKey: logKmsKey,
    retention: RetentionDays.ONE_WEEK,
    removalPolicy: removalPolicy,
  });

  //Allow vpc flowlog to access KMS key to encrypt logs
  logKmsKey.addToResourcePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new ServicePrincipal(`logs.${Stack.of(scope).region}.amazonaws.com`)],
      actions: [
        'kms:Encrypt*',
        'kms:Decrypt*',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:Describe*',
      ],
      conditions: {
        ArnLike: {
          'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${Stack.of(scope).region}:${Stack.of(scope).account}:*`,
        },
      },
      resources: ['*'],
    }),
  );

  //Setup the VPC flow logs
  const iamFlowLogRole = vpcFlowLogRole || new Role(scope, 'FlowLogRole', {
    assumedBy: new ServicePrincipal('vpc-flow-logs.amazonaws.com'),
  });

  vpc.addFlowLog(`${logGroupResourceId}`, {
    destination: FlowLogDestination.toCloudWatchLogs(vpcFlowLogLogGroup, iamFlowLogRole),
  });

  // Create a gateway endpoint for S3
  const s3GatewayVpcEndpoint: GatewayVpcEndpoint = vpc.addGatewayEndpoint('DsfS3VpcEndpoint', {
    service: GatewayVpcEndpointAwsService.S3,
  });

  if (eksClusterName) {

    // Add tags to subnets
    for (let subnet of [...vpc.publicSubnets, ...vpc.privateSubnets]) {
      Tags.of(subnet).add('karpenter.sh/discovery', eksClusterName);
    }

    // Add tags to vpc
    Tags.of(vpc).add('karpenter.sh/discovery', eksClusterName);

  }

  if (emrAppName) {

    // Add tags to subnets
    for (let subnet of [...vpc.publicSubnets, ...vpc.privateSubnets]) {
      Tags.of(subnet).add('use-by', 'emr-serverless');
    }

    // Add tags to vpc
    Tags.of(vpc).add('use-by', 'emr-serverless');

  }

  const networkConfiguration: NetworkConfiguration = {
    vpc,
    s3GatewayVpcEndpoint,
    vpcFlowLogLogGroup,
    iamFlowLogRole,
  };

  return networkConfiguration;
}