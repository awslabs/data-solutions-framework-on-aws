// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc } from 'aws-cdk-lib/aws-ec2';
import { EngineVersion } from 'aws-cdk-lib/aws-opensearchservice';


/**
 * Simplified configuration for the Opensearch Cluster.
 * @param domainName OpenSearchCluster domain name
 * @param version OpenSearch version, default is OpenSearch_2.9
 * @param dataNodeInstanceType Data node instance type, default is OpenssearchNodes.DATA_NODE_INSTANCE_DEFAULT
 * @param dataNodeInstanceCount Data node instance count, default is equal to the number of AZs for vpc domain, 2 for public domain.
 * @param masterNodeInstanceType Master node instance type, default is OpenssearchNodes.MASTER_NODE_INSTANCE_DEFAULT
 * @param masterNodeInstanceCount Master node instance count, default is 3
 * @param warmInstanceType Warm node instance type, default is OpenssearchNodes.WARM_NODE_INSTANCE_DEFAULT
 * @param warmInstanceCount Warm node instance count, default is 0
 * @param multiAzWithStandbyEnabled Multi AZ with Standby enabled, default is false
 * @param zoneAwarenessEnabled Zone Awareness enabled, default is true
 * @param ebsVolumeType EBS Volume Type, default is gp3
 * @param ebsSize EBS Volume Size, default is 10
 * @param samlEntityId SAML Idp Entity Id
 * @param samlMetadataContent SAML Idp XML Metadata Content, needs to be downloaded from IAM Identity Center
 * @param samlRolesKey SAML Roles Key, default "Role"
 * @param samlSubjectKey SAML Subject Key, default none
 * @param samlSessionTimeoutMinutes SAML Session Timeout Minutes, default is 480 minutes
 * @param samlMasterBackendRole SAML Idp Admin GroupId as returned by {user:groups} in Idp
 * @param enableAutoSoftwareUpdate Enable Auto Software Update, default is false
 * @param enableVersionUpgrade Enable Version Upgrade, default is false
 * @param encryptionKmsKeyArn Encryption KMS Key Arn, default is none
 * @param deployInVpc deploy OpenSearch cluster in vpc, default true. Ser deployInVpc=false to create public domain endpoint.
 * @param vpc VPC where the cluster is deployed, default new vpc is created if deployInVpc=true, @see DataVpc
 * @param masterUserName OpenSearch master user name for internal database
 * @param removalPolicy Removal Policy, default is retain.
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
  readonly samlEntityId:string;
  readonly samlMetadataContent:string;
  readonly samlMasterBackendRole:string;
  readonly samlRolesKey?:string;
  readonly samlSubjectKey?:string;
  readonly samlSessionTimeoutMinutes?:number;
  readonly enableAutoSoftwareUpdate?: boolean;
  readonly enableVersionUpgrade?: boolean;
  readonly encryptionKmsKeyArn?:string;
  readonly deployInVpc:boolean;
  readonly vpc?: IVpc;
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * Default Node Instances for Opensearch cluster
 */
export enum OpensearchNodes {
  DATA_NODE_INSTANCE_DEFAULT = 'm6g.xlarge.search',
  MASTER_NODE_INSTANCE_DEFAULT = 'm6g.large.search',
  WARM_NODE_INSTANCE_DEFAULT = 'ultrawarm1.medium.search',
}