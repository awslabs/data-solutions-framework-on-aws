// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
   * The name of the Redshift Serverless Namespace
   */
  readonly name: string;

  /**
   * The name of the primary database that would be created in the Redshift Serverless Namespace
   */
  readonly dbName: string;

  /**
   * Default IAM Role associated to the Redshift Serverless Namespace
   * @default - No default IAM Role is associated with the Redshift Serverless Namespace
   */
  readonly defaultIAMRole?: IRole;

  /**
   * List of IAM Roles attached to the Redshift Serverless Namespace.
   * This list of Roles must also contain the `defaultIamRole`.
   * @default - No IAM roles are associated with the Redshift Serverless Namespace
   */
  readonly iamRoles?: IRole[];

  /**
   * The KMS Key used to encrypt the data.
   * @default - A new KMS Key is created
   */
  readonly dataKey?: Key;

  /**
   * The type of logs to be exported.
   * @default - No logs are exported
   */
  readonly logExports?: RedshiftServerlessNamespaceLogExport[];

  /**
   * The admin username to be used.
   * @default - The default username is "admin"
   */
  readonly adminUsername?: string;

  /**
   * The KMS Key used by the managed Secrets Manager Secret storing admin credentials.
   * @default - A new KMS Key is created
   */
  readonly adminSecretKey?: Key;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}