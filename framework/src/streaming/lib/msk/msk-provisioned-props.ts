// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  AclOperationTypes,
  AclPermissionTypes,
  AclResourceTypes,
  BrokerLogging,
  ClientAuthentication,
  ClusterConfigurationInfo,
  EbsStorageInfo,
  KafkaVersion,
  MonitoringConfiguration,
  MskBrokerInstanceType,
  ResourcePatternTypes,
  StorageMode,
} from './msk-provisioned-props-utils';

export interface MskProvisionedProps {
  /**
      * The physical name of the cluster.
      */
  readonly clusterName?: string;

  /**
      * The version of Apache Kafka.
      */
  readonly kafkaVersion?: KafkaVersion;

  /**
      * Number of Apache Kafka brokers deployed in each Availability Zone.
      *
      * @default 1
      */
  readonly numberOfBrokerNodes?: number;

  /**
      * Defines the virtual networking environment for this cluster.
      * Must have at least 2 subnets in two different AZs.
      */
  readonly vpc?: IVpc;

  /**
      * Where to place the nodes within the VPC.
      * Amazon MSK distributes the broker nodes evenly across the subnets that you specify.
      * The subnets that you specify must be in distinct Availability Zones.
      * Client subnets can't be in Availability Zone us-east-1e.
      *
      * @default - the Vpc default strategy if not specified.
      */
  readonly vpcSubnets?: SubnetSelection;

  /**
      * The EC2 instance type that you want Amazon MSK to use when it creates your brokers.
      *
      * @see https://docs.aws.amazon.com/msk/latest/developerguide/msk-create-cluster.html#broker-instance-types
      * @default kafka.m5.large
      */
  readonly mskBrokerinstanceType?: MskBrokerInstanceType;

  /**
      * The AWS security groups to associate with the elastic network interfaces in order to specify who can
      * connect to and communicate with the Amazon MSK cluster.
      *
      * @default - create new security group
      */
  readonly securityGroups?: ISecurityGroup[];

  /**
      * Information about storage volumes attached to MSK broker nodes.
      *
      * @default - 100 GiB EBS volume
      */
  readonly ebsStorageInfo?: EbsStorageInfo;

  /**
      * This controls storage mode for supported storage tiers.
      *
      * @default - StorageMode.LOCAL
      * @see https://docs.aws.amazon.com/msk/latest/developerguide/msk-tiered-storage.html
      */
  readonly storageMode?: StorageMode;

  /**
      * The Amazon MSK configuration to use for the cluster.
      *
      * @default - none
      */
  readonly configurationInfo?: ClusterConfigurationInfo;

  /**
      * Cluster monitoring configuration.
      *
      * @default - DEFAULT monitoring level
      */
  readonly monitoring?: MonitoringConfiguration;

  /**
        * Configure your MSK cluster to send broker logs to different destination types.
        *
        * @default - A Cloudwatch log is created
        */
  readonly logging?: BrokerLogging;

  /**
      * Configuration properties for client authentication.
      * MSK supports using private TLS certificates or SASL/SCRAM to authenticate the identity of clients.
      *
      * @default - IAM is used
      */
  readonly clientAuthentication?: ClientAuthentication;

  /**
      * What to do when this resource is deleted from a stack.
      *
      * @default RemovalPolicy.RETAIN
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
      * @default false
    */
  readonly allowEveryoneIfNoAclFound?: boolean;

  /**
     * The log level for the lambda that support the Custom Resource
     * for both Managing ACLs and Topics.
     * @default INFO
     */
  readonly kafkaClientLogLevel?: KafkaClientLogLevel;

}

/**
 * The CDK Custom resources uses KafkaJs
 * This enum allow you to set the log level
 */
export enum KafkaClientLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
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

/**
 * Kakfa ACL
 * This is similar to the object used by `kafkajs`, for more information see this [link](https://kafka.js.org/docs/admin#create-acl)
 */
export interface Acl {
  readonly principal: string;
  readonly host: string;
  readonly operation: AclOperationTypes;
  readonly permissionType: AclPermissionTypes;
  readonly resourceType: AclResourceTypes;
  readonly resourceName: string;
  readonly resourcePatternType: ResourcePatternTypes;
}

