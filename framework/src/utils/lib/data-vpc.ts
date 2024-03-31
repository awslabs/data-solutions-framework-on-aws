// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import {
  ClientVpnEndpoint, ClientVpnEndpointOptions, ClientVpnUserBasedAuthentication,
  FlowLogDestination, GatewayVpcEndpointAwsService, IGatewayVpcEndpoint,
  ISecurityGroup, IpAddresses, Peer, Port, SecurityGroup, SubnetType,
  TransportProtocol, IVpc, Vpc, VpnPort,
} from 'aws-cdk-lib/aws-ec2';
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
   * The log group for Client VPN Endpoint
   */
  public readonly vpnLogGroup: ILogGroup | undefined;
  /**
   * The security group for Client VPN Endpoint
   */
  public readonly vpnSecurityGroups: ISecurityGroup[] | undefined;


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

    let defaultNumberOfNat =
      Stack.of(this).availabilityZones.length >3 ?
        3 : Stack.of(this).availabilityZones.length;

    this.vpc = new Vpc(scope, 'Vpc', {
      ipAddresses: IpAddresses.cidr(props.vpcCidr),
      maxAzs: 3,
      natGateways: props.natGateways ?? defaultNumberOfNat,
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

    // Create a Client VPN Endpoint
    if (props.clientVpnEndpointProps) {
      [this.vpnSecurityGroups, this.vpnLogGroup, this.clientVpnEndpoint] = this.setupClientVpn(scope, props, removalPolicy, retention);
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

  /**
   * @internal
   * Configure Client VPN Endpoint
   * @param scope current scope
   * @param props DataVpcProps
   * @param removalPolicy RemovalPolicy
   * @param retention RetentionDays for Cloudwatch log group
   * @returns [ISecurityGroup[], ILogGroup, ClientVpnEndpoint] created ClientVpnEndpoint alongside with security group and log group.
   */
  private setupClientVpn(scope:Construct, props:DataVpcProps, removalPolicy:RemovalPolicy, retention:RetentionDays):
  [ISecurityGroup[], ILogGroup, ClientVpnEndpoint] {

    const vpnSamlProvider = new SamlProvider(scope, 'SamlProviderVpnEndpoint', {
      metadataDocument: SamlMetadataDocument.fromXml(props.clientVpnEndpointProps!.samlMetadataDocument),
    });

    const endpointProps = {
      ...props.clientVpnEndpointProps,
      vpnSubnets: this.vpc.selectSubnets({ onePerAz: true, subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
      userBasedAuthentication: ClientVpnUserBasedAuthentication.federated(vpnSamlProvider),
      cidr: this.vpc.publicSubnets[0].ipv4CidrBlock,
    };

    endpointProps.logging ??= true;
    endpointProps.transportProtocol ??= TransportProtocol.TCP;
    endpointProps.splitTunnel ??= true;
    endpointProps.dnsServers ??= [props.vpcCidr.replace(/^(\d+)\.(\d+)\.(\d+)\.\d+\/\d+$/, '$1.$2.$3.2')];
    endpointProps.authorizeAllUsersToVpcCidr ??= true;
    endpointProps.port ??= VpnPort.HTTPS;
    endpointProps.selfServicePortal ??= true;

    if (!endpointProps.securityGroups) {
      const vpnSecurityGroup = new SecurityGroup(scope, 'vpnSecurityGroup', {
        vpc: this.vpc,
        allowAllOutbound: false,
      });
      vpnSecurityGroup.addIngressRule(
        Peer.ipv4(props.vpcCidr),
        (endpointProps.transportProtocol == TransportProtocol.TCP) ?
          Port.tcp(endpointProps.port) : Port.udp(endpointProps.port),
      );
      vpnSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443));
      vpnSecurityGroup.applyRemovalPolicy(removalPolicy);
      endpointProps.securityGroups = [vpnSecurityGroup];
    };

    if (!endpointProps.logGroup) {
      const vpnLogGroup = new LogGroup(scope, 'vpnLogGroup', {
        encryptionKey: this.flowLogKey,
        retention,
        removalPolicy: removalPolicy,
      });
      endpointProps.logGroup = vpnLogGroup;
    }

    const clientVpnEndpoint = this.vpc.addClientVpnEndpoint('Endpoint', endpointProps as ClientVpnEndpointOptions);

    clientVpnEndpoint.applyRemovalPolicy(removalPolicy);

    return [endpointProps.securityGroups, endpointProps.logGroup, clientVpnEndpoint];
  }
}