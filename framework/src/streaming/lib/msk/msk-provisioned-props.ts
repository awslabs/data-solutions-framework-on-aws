// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  BrokerLogging,
  ClientAuthentication,
  ClusterConfigurationInfo,
  EbsStorageInfo,
  KafkaVersion,
  MonitoringConfiguration,
  MskBrokerInstanceType,
  StorageMode,
  VpcClientAuthentication,
  KafkaClientLogLevel,
} from './msk-utils';

export interface MskProvisionedProps {
  /**
   * The name of the MSK provisioned cluster.
   * @default - default-msk-provisioned
   */
  readonly clusterName?: string;

  /**
   * The version of Apache Kafka.
   * @default - KafkaVersion.V3_5_1
   */
  readonly kafkaVersion?: KafkaVersion;

  /**
   * The number of Apache Kafka brokers deployed.
   * It must be a multiple of the number of availability zones.
   * @default - 1 per availability zone.
   */
  readonly brokerNumber?: number;

  /**
   * The VPC where to deploy the MSK Serverless cluster.
   * Must have at least 2 subnets in two different AZs.
   * @default - A new VPC is created.
   */
  readonly vpc?: IVpc;

  /**
   * The subnets where to deploy the MSK Provisioned cluster.
   * Amazon MSK distributes the broker nodes evenly across these subnets.
   * The subnets must be in distinct Availability Zones.
   * Client subnets can't be in Availability Zone us-east-1e.
   * @default - the private subnets with egress.
   */
  readonly subnets?: SubnetSelection;

  /**
   * The EC2 instance type that you want Amazon MSK to use when it creates your brokers.
   * @see https://docs.aws.amazon.com/msk/latest/developerguide/msk-create-cluster.html#broker-instance-types
   * @default kafka.m5.large
   */
  readonly brokerInstanceType?: MskBrokerInstanceType;

  /**
   * The AWS security groups to associate with the elastic network interfaces of the Amazon MSK cluster.
   * @default - create a new security group
   */
  readonly securityGroups?: ISecurityGroup[];

  /**
   * Information about storage volumes attached to MSK broker nodes.
   * @default - 100 GiB EBS volume
   */
  readonly ebsStorage?: EbsStorageInfo;

  /**
   * This controls storage mode for supported storage tiers.
   * @default - StorageMode.LOCAL
   * @see https://docs.aws.amazon.com/msk/latest/developerguide/msk-tiered-storage.html
   */
  readonly storageMode?: StorageMode;

  /**
   * The Amazon MSK configuration to use for the cluster.
   * @default - none
   */
  readonly configuration?: ClusterConfigurationInfo;

  /**
   * Cluster monitoring configuration.
   * @default - DEFAULT monitoring level
   */
  readonly monitoring?: MonitoringConfiguration;

  /**
   * Configure your MSK cluster to send broker logs to different destination types.
   * @default - A Cloudwatch log is created
   */
  readonly logging?: BrokerLogging;

  /**
   * Configuration properties for client authentication.
   * MSK supports using private TLS certificates or SASL/SCRAM to authenticate the identity of clients.
   * @default - IAM is used
   */
  readonly clientAuthentication?: ClientAuthentication;

  /**
   * VPC connection control settings for brokers
   * Defines all client authentication information for VpcConnectivity.
   * When vpcConnectivity and you provide your own Msk Congifuration
   * You must set `allow.everyone.if.no.acl.found` to `false`
   */
  readonly vpcConnectivity?: VpcClientAuthentication;

  /**
   * What to do when this resource is deleted from a stack.
   * @default - RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * This Props allow you to define the principals that will be adminstartor
   * as well as the principal that will be used by the CDK Custom resources to
   */
  readonly certificateDefinition?: AclAdminProps;

  /**
   * if set the to true the following Kafka configuration
   * `allow.everyone.if.no.acl.found` is set to true.
   * When no Cluster Configuration is passed
   * The construct create a cluster configuration
   * and set the following configuration to false and apply it to the cluster
   * @default - false
   */
  readonly allowEveryoneIfNoAclFound?: boolean;

  /**
   * The log level for the lambda that support the Custom Resource
   * for both Managing ACLs and Topics.
   * @default - INFO
   */
  readonly kafkaClientLogLevel?: KafkaClientLogLevel;

  /**
   * If set to true, the cluster handler functions will be placed in the private subnets of the cluster vpc.
   */
  readonly placeClusterHandlerInVpc?: boolean;

  /**
   * This parameter is required after executing the first `cdk deploy`
   * It is the version of the MSK cluster that was deployed in the previous `cdk deploy`
   * The cluster might fail in the subsequent updates if it is not set
   * This parameter is obtained by running the following command
   * `aws kafka describe-cluster --cluster-arn YOUR_CLUSTER_ARN`
   */
  readonly currentVersion?: string;

  /**
   * If there is an already existing service token deployed for the custom resource
   * you can reuse it to reduce the number of resource created
   */
  readonly serviceToken?: string;
}


/**
 * This Props allow you to define the principals that will be adminstartor
 * as well as the principal that will be used by the CDK Custom resources to
 */
export interface AclAdminProps {
  /**
   * The Principal that will have administrator privilege in MSK
   * The MSK construct does not have access to this principal
   * Keep this principal in a secure storage and should be only used
   * in case you put an ACL that lock MSK access
   */
  readonly adminPrincipal: string;
  /**
   * This Principal will be used by the CDK custom resource
   * to set ACLs and Topics
   */
  readonly aclAdminPrincipal: string;
  /**
   * This is the TLS certificate of the Principal that is used by
   * the CDK custom resource which set ACLs and Topics.
   * The secret in AWS secrets manager must be a JSON in the following format
   * {
   *  "key" : "PRIVATE-KEY",
   *  "cert" : "CERTIFICATE"
   * }
   *
   * You can use the following utility to generate the certificates
   * https://github.com/aws-samples/amazon-msk-client-authentication
   */
  readonly secretCertificate: ISecret;

}

