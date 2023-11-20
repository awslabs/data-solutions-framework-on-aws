// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { RemovalPolicy } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';

/**
 * Namespace log export types
 */
export enum RedshiftServerlessNamespaceLogExport {
  USER_LOG = 'userlog',
  CONNECTION_LOG = 'connectionlog',
  USER_ACTIVITY_LOG = 'useractivitylog'
}

/**
 * RedshiftServerlessNamespace properties
 */
export interface RedshiftServerlessNamespaceProps {
  /**
   * The name of the namespace
   */
  readonly name: string;

  /**
   * The name of the primary database that would be created in the namespace
   */
  readonly dbName: string;

  /**
   * Default IAM role
   */
  readonly defaultIAMRole?: IRole;

  /**
   * List of IAM roles to be attached to the namespace
   */
  readonly iamRoles?: IRole[];

  /**
   * The KMS key used to encrypt the data.
   * @default If none is provided, a new key would be created
   */
  readonly kmsKey?: Key;

  /**
   * Logs to be exported
   */
  readonly logExports?: RedshiftServerlessNamespaceLogExport[];

  /**
   * The admin username to be used.
   * @default If none is provided, the default username is "admin"
   */
  readonly adminUsername?: string;

  /**
   * The removal policy when the stack is deleted
   */
  readonly removalPolicy?: RemovalPolicy;
}