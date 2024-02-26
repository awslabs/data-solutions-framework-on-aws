// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { EngineVersion } from 'aws-cdk-lib/aws-opensearchservice';


/**
 * Simplified configuration for the Opensearch Cluster.
 */
export interface OpensearchProps {
  /**
   * The OpenSearch Domain name
   */
  readonly domainName: string;
  /**
   * The OpenSearch version
   * @default - @see OPENSEARCH_DEFAULT_VERSION
   */
  readonly version?: EngineVersion;
  /**
   * The EC2 Instance Type used for OpenSearch data nodes
   * @default - @see OpensearchNodes.DATA_NODE_INSTANCE_DEFAULT
   */
  readonly dataNodeInstanceType?: string;
  /**
   * The number of OpenSearch data nodes to provision
   * @default - 2 data nodes are created if no VPC is configured
   */
  readonly dataNodeInstanceCount?: number;
  /**
   * The EC2 Instance Type for OpenSearch master nodes
   * @default - @see OpensearchNodes.MASTER_NODE_INSTANCE_DEFAULT
   */
  readonly masterNodeInstanceType?: string;
  /**
   * The number of OpenSearch master nodes to provision
   * @default - 3 master nodes are created
   */
  readonly masterNodeInstanceCount?: number;
  /**
   * The type of nodes for Ultra Warn nodes
   * @default - @see OpensearchNodes.WARM_NODE_INSTANCE_DEFAULT
   */
  readonly warmInstanceType?:number;
  /**
   * The number of Ultra Warn nodes to provision
   * @default - No Ultra Warn nodes are created
   */
  readonly warmInstanceCount?: number;
  /**
   * If multi AZ with standby mode is enabled
   * @default - false
   */
  readonly multiAzWithStandbyEnabled?: boolean;
  /**
   * The type of EBS Volumes to use
   * @default - EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3 is used
   */
  readonly ebsVolumeType?: EbsDeviceVolumeType;
  /**
   * The size of EBS Volumes to use
   * @default - 10
   */
  readonly ebsSize?: number;
  /**
   * The SAML entity ID used for SAML based authentication
   */
  readonly samlEntityId:string;
  /**
   * The SAML Idp XML Metadata Content, needs to be downloaded from IAM Identity Center
   */
  readonly samlMetadataContent:string;
  /**
   * The SAML Idp Admin GroupId as returned by {user:groups} in Idp
   */
  readonly samlMasterBackendRole:string;
  /**
   * The SAML Roles Key
   * @default - "Role" is used
   */
  readonly samlRolesKey?:string;
  /**
   * The SAML Subject Key
   * @default - No subject key is used
   */
  readonly samlSubjectKey?:string;
  /**
   * The timeout of the SAML session. Max allowed value is 24 hours.
   * @default - 480 minutes
   */
  readonly samlSessionTimeout?: Duration;
  /**
   * Enable OpenSearch Auto Software Update
   * @default - false
   */
  readonly enableAutoSoftwareUpdate?: boolean;
  /**
   * Enable OpenSearch Version Upgrade
   * @default - false
   */
  readonly enableVersionUpgrade?: boolean;
  /**
   * The KMS Key for encryption in OpenSearch (data and logs)
   * @default - A new key is created
   */
  readonly encryptionKey?: IKey;
  /**
   * If the OpenSearch Domain is created in a default VPC when there is no VPC configured
   */
  readonly deployInVpc:boolean;
  /**
   * The VPC to deploy the OpenSearch Domain
   * @default - A new VPC is created if deployInVpc=true, @see DataVpc
   */
  readonly vpc?: IVpc;
  /**
   * The VPC Subnets to deploy the OpenSearch cluster nodes. Only used for VPC deployments.
   * You must specify VPC if you specify this parameter.
   * @default - Single private subnet per each AZ. @see DataVpc
   */
  readonly vpcSubnets?: SubnetSelection;
  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * Default Node Instances for Opensearch cluster
 */
export enum OpensearchNodes {
  DATA_NODE_INSTANCE_DEFAULT = 'r6g.xlarge.search',
  MASTER_NODE_INSTANCE_DEFAULT = 'm6g.large.search',
  WARM_NODE_INSTANCE_DEFAULT = 'ultrawarm1.medium.search',
}

export const OPENSEARCH_DEFAULT_VERSION = EngineVersion.OPENSEARCH_2_11;
