import { RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { FlowLogDestination, GatewayVpcEndpointAwsService, IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


/**
 * @internal
 * Upload podTemplates to the Amazon S3 location used by the cluster.
 * @param {Construct} scope The local path of the yaml podTemplate files to upload
 * @param {string} vpcCidr The cidr for vpc
 * @param {string} eksClusterName The name used to tag the subnet and vpc
 * @param {Key} logKmsKey The KMS key used to encrypt the VPC flow log 
 */

export function vpcBootstrap(scope: Construct, vpcCidr: string, eksClusterName: string, logKmsKey: Key): Vpc {

  const vpcMask = parseInt(vpcCidr.split('/')[1]);
  const smallestVpcCidr: number = 28;


  if (vpcMask < smallestVpcCidr) {
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
    removalPolicy: RemovalPolicy.DESTROY,
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
  vpc.addGatewayEndpoint('S3Endpoint', {
    service: GatewayVpcEndpointAwsService.S3,
  });

  // Add tags to subnets
  for (let subnet of [...vpc.publicSubnets, ...vpc.privateSubnets]) {
    Tags.of(subnet).add('karpenter.sh/discovery', eksClusterName);
  }

  // Add tags to vpc
  Tags.of(vpc).add('karpenter.sh/discovery', eksClusterName);

  return vpc;
}
