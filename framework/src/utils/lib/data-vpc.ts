// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack, Tags } from 'aws-cdk-lib';
import { ClientVpnEndpoint, ClientVpnUserBasedAuthentication, FlowLogDestination, GatewayVpcEndpointAwsService, IGatewayVpcEndpoint, IVpc, IpAddresses, SubnetType, TransportProtocol, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, IRole, PolicyStatement, Role, SamlMetadataDocument, SamlProvider, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Context } from './context';
import { DataVpcProps } from './data-vpc-props';

/**
 * Creates a VPC with best practices for securely deploying data solutions.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Utils/data-vpc
 *
 * @example
 *
 * const vpc = new dsf.utils.DataVpc(this, 'DataVpc', {
 *   vpcCidr: '10.0.0.0/16',
 * });
 *
 * vpc.tagVpc('Name', 'My VPC');
 */
export class DataVpc extends Construct {

  /**
   * The amazon VPC created
   */
  public readonly vpc: IVpc;
  /**
   * The KMS Key used to encrypt VPC flow logs
   */
  public readonly flowLogKey: IKey;
  /**
   * The IAM role used to publish VPC Flow Logs
   */
  public readonly flowLogRole: IRole;
  /**
   * The CloudWatch Log Group created for the VPC flow logs
   */
  public readonly flowLogGroup: ILogGroup;
  /**
   * The S3 VPC endpoint gateway
   */
  public readonly s3VpcEndpoint: IGatewayVpcEndpoint;
  /**
   * The Client VPN Endpoint
   */
  public readonly clientVpnEndpoint: ClientVpnEndpoint | undefined;
  /**
   * The SAML Provider for Client VPN Endpoint
   */
  public readonly samlProvider: SamlProvider | undefined;
  /**
   * The log group for Client VPN Endpoint
   */
  public readonly vpnLogGroup: LogGroup | undefined;

  constructor(scope: Construct, id: string, props: DataVpcProps) {

    super(scope, id);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    const retention = props.flowLogRetention || RetentionDays.ONE_WEEK;

    this.flowLogKey = props.flowLogKey || new Key(this, 'FlowLogKey', {
      description: 'vpc-logs-key',
      enableKeyRotation: true,
      removalPolicy: removalPolicy,
    });

    this.flowLogRole = props.flowLogRole || new Role(scope, 'FlowLogRole', {
      assumedBy: new ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    const vpcMask = parseInt(props.vpcCidr.split('/')[1]);
    const smallestVpcCidr: number = 28;
    if (vpcMask > smallestVpcCidr) {
      throw new Error(`The VPC netmask should be at least 28, netmask provided is ${vpcMask}`);
    }

    // Calculate subnet masks based on VPC's mask
    const publicSubnetMask = vpcMask + 4;
    const privateSubnetMask = publicSubnetMask + 2; // twice as large as public subnet

    this.vpc = new Vpc(scope, 'Vpc', {
      ipAddresses: IpAddresses.cidr(props.vpcCidr),
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

    //Create VPC flow log for the VPC
    this.flowLogGroup = new LogGroup(scope, 'FLowLogGroup', {
      encryptionKey: this.flowLogKey,
      retention,
      removalPolicy: removalPolicy,
    });

    //Allow vpc flowlog to access KMS key to encrypt logs
    this.flowLogKey.addToResourcePolicy(
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

    this.vpc.addFlowLog('FlowLog', {
      destination: FlowLogDestination.toCloudWatchLogs(this.flowLogGroup, this.flowLogRole),
    });

    // Create a gateway endpoint for S3
    this.s3VpcEndpoint= this.vpc.addGatewayEndpoint('S3VpcEndpoint', {
      service: GatewayVpcEndpointAwsService.S3,
    });

    if (props.vpnEndpointCertificateArn){

      this.vpnLogGroup = new LogGroup(scope, 'vpnLogGroup', {
        encryptionKey: this.flowLogKey,
        retention,
        removalPolicy: removalPolicy,
      });
      this.vpnLogGroup.grantWrite(new ServicePrincipal('ec2.amazonaws.com'));

      this.samlProvider = new SamlProvider(scope, 'SamlProviderVpnEndpoint', {
        metadataDocument: SamlMetadataDocument.fromXml(props.vpnEndpointSamlMetadata!),
      });

      this.clientVpnEndpoint = this.vpc.addClientVpnEndpoint('Endpoint', {
        cidr: this.vpc.publicSubnets[0].ipv4CidrBlock,
        serverCertificateArn: props.vpnEndpointCertificateArn,
        userBasedAuthentication: ClientVpnUserBasedAuthentication.federated(this.samlProvider),
        authorizeAllUsersToVpcCidr: true,
        dnsServers:[this.vpc.vpcCidrBlock.replace(/^(\d+)\.(\d+)\.(\d+)\.\d+\/\d+$/,"$1.$2.$3.2")],
        splitTunnel: true,
        logging:true,
        logGroup:this.vpnLogGroup,
        transportProtocol: TransportProtocol.TCP,
        vpcSubnets: this.vpc.selectSubnets({ subnets:[this.vpc.publicSubnets[0]]}),
      });

      this.clientVpnEndpoint.applyRemovalPolicy(removalPolicy);
    }
        
  }

  /**
   * Tag the VPC and the subnets
   * @param key the tag key
   * @param value the tag value
   */
  public tagVpc(key: string, value: string) {
    // Add tags to subnets
    for (let subnet of [...this.vpc.publicSubnets, ...this.vpc.privateSubnets]) {
      Tags.of(subnet).add(key, value);
    }
    // Add tags to vpc
    Tags.of(this.vpc).add(key, value);
  }
}