import { RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { FlowLogDestination, GatewayVpcEndpoint, GatewayVpcEndpointAwsService, IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Context } from './context';

/**
 * @internal
 * @param {Vpc} vpc the vpc created by the function vpcBootstrap
 * @param {GatewayVpcEndpoint} s3GatewayVpcEndpoint the vpc endpoint attached to the vpc the function vpcBootstrap created
*/
export interface NetworkConfiguration {
  readonly vpc: Vpc;
  readonly s3GatewayVpcEndpoint: GatewayVpcEndpoint;
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
  logKmsKey: Key,
  vpcFlowlogRemovalPolicy?: RemovalPolicy,
  eksClusterName?: string,
  emrAppName?: string): NetworkConfiguration {

  const vpcMask = parseInt(vpcCidr.split('/')[1]);
  const smallestVpcCidr: number = 28;


  const removalPolicy = Context.revertRemovalPolicy(scope, vpcFlowlogRemovalPolicy);

  if (vpcMask > smallestVpcCidr) {
    throw new Error(`The VPC netmask should be at least 28, netmask provided is ${vpcMask}`);
  }

  // Calculate subnet masks based on VPC's mask
  const publicSubnetMask = vpcMask + 4;
  const privateSubnetMask = publicSubnetMask + 2; // twice as large as public subnet

  const vpc = new Vpc(scope, 'MyVPC', {
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


  //Create VPC flow log for the EKS VPC
  let eksVpcFlowLogLogGroup = new LogGroup(scope, 'eksVpcFlowLogLogGroup', {
    logGroupName: `/aws/emr-eks-vpc-flow/${eksClusterName}`,
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
  const iamRoleforFlowLog = new Role(scope, 'iamRoleforFlowLog', {
    assumedBy: new ServicePrincipal('vpc-flow-logs.amazonaws.com'),
  });

  vpc.addFlowLog('eksVpcFlowLog', {
    destination: FlowLogDestination.toCloudWatchLogs(eksVpcFlowLogLogGroup, iamRoleforFlowLog),
  });

  // Create a gateway endpoint for S3
  const s3GatewayVpcEndpoint: GatewayVpcEndpoint = vpc.addGatewayEndpoint('S3Endpoint', {
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
    vpc: vpc,
    s3GatewayVpcEndpoint: s3GatewayVpcEndpoint,
  };

  return networkConfiguration;
}