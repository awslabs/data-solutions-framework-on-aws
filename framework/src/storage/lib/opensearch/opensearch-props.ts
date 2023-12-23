// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { EbsDeviceVolumeType, IVpc } from 'aws-cdk-lib/aws-ec2';
import { SAMLOptionsProperty, EngineVersion } from 'aws-cdk-lib/aws-opensearchservice';
import { OpensearchCluster } from './opensearch';
import { RemovalPolicy } from 'aws-cdk-lib';


/**
 * Simplified configuration for the Opensearch Cluster.
 * @param name domainName OpensearchCluster domain name
 * @param version OpenSearch version, default is OpenSearch_2.11
 * @param dataNodeInstanceType Data node instance type, default is t3.medium
 * @param dataNodeInstanceCount Data node instance count, default is 1
 * @param masterNodeInstanceType Master node instance type, default is t3.medium
 * @param masterNodeInstanceCount Master node instance count, default is 1
 * @param warmInstanceType Warm node instance type, default is t3.medium
 * @param warmInstanceCount Warm node instance count, default is 1
 * @param multiAzWithStandbyEnabled Multi AZ with Standby enabled, default is false
 * @param zoneAwarenessEnabled Zone Awareness enabled, default is false
 * @param ebsVolumeType EBS Volume Type, default is gp3
 * @param ebsSize EBS Volume Size, default is 10
 * @param enableSAML enable SAML authentication, default is false
 * @param saml SAML options, if enableSAML is true, default IDP is AWS Identity Center.
 * @param samlAdminGroupId SAML Idp Admin GroupId as returned by {user:groups} by Idp, required if enableSAML is true
 * @param samlDashboardGroupId SAML Idp DashboardUsers GroupId as returned by {user:groups} by Idp, required if enableSAML is true
 * @param enableAutoSoftwareUpdate Enable Auto Software Update, default is false
 * @param enableVersionUpgrade Enable Version Upgrade, default is false
 * @param encryptionKmsKeyArn Encryption KMS Key Arn, default is none
 * @param vpc VPC where the cluster is deployed, default is none
 * @param masterUserName Opensearch master user name for internal database
 */
export interface OpensearchProps {
  readonly domainName: string;
  readonly version?: EngineVersion;
  readonly dataNodeInstanceType?: string;
  readonly dataNodeInstanceCount?: number;
  readonly masterNodeInstanceType?: string;
  readonly masterNodeInstanceCount?: number;
  readonly warmInstanceType?:number;
  readonly warmInstanceCount?: number;
  readonly multiAzWithStandbyEnabled?: boolean;
  readonly ebsVolumeType?: EbsDeviceVolumeType;
  readonly ebsSize?: number;
  readonly saml: SAMLOptionsProperty;
  readonly samlAdminGroupId?:string;
  readonly samlDashboardGroupId?:string;
  readonly enableAutoSoftwareUpdate?: boolean;
  readonly enableVersionUpgrade?: boolean;
  readonly encryptionKmsKeyArn?:string;
  readonly vpc?: IVpc;
  readonly masterUserName?:string;
  readonly removalPolicy?: RemovalPolicy;
}
/**
 * Configuration properties for Opensearch proxy
 * @param opensearchCluster Opensearch cluster
 * @param vpc VPC where the proxy is deployed, default is the VPC where the OPensearch cluster is deployed
 * @param localPort Local port to expose the proxy on, default is 8080
 */

export interface OpensearchProxyProps {
  readonly opensearchCluster: OpensearchCluster;
  readonly proxyPort?: number;
}


/**
 * Default Node Instances for Opensearch cluster
 */
export enum OpensearchNodes {
  DATA_NODE_INSTANCE_DEFAULT = 'm6g.xlarge.search',
  MASTER_NODE_INSTANCE_DEFAULT = 'm6g.large.search',
  WARM_NODE_INSTANCE_DEFAULT = 'ultrawarm1.medium.search',
}