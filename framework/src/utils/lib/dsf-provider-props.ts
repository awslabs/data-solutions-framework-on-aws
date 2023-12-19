// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Policy, Role } from 'aws-cdk-lib/aws-iam';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';


/**
 * @internal
 * The properties for the DsfProvider construct
 */

export interface DsfProviderProps {

  /**
   * The policy to apply when the bucket is removed from this stack.
   * @default - RETAIN The resources will not be deleted.
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The name of the custom resource provider
   */
  readonly providerName: string;

  /**
   * Handler definition
   */
  readonly onEventHandlerDefinition: HandlerDefinition;

  /**
   * Handler definition
   */
  readonly isCompleteHandlerDefinition?: HandlerDefinition;

  readonly vpc?: IVpc;

  readonly subnets?: SubnetSelection;

  readonly securityGroups?: SecurityGroup [];

  readonly queryInterval?: Duration;

  readonly queryTimeout?: Duration;

}

export interface HandlerDefinition {
  bundling?: BundlingOptions;
  IamRole?: Role;
  crPolicy?: Policy;
  crManagedPolicy?: ManagedPolicy;
  depsLockFilePath: string;
  /**
   * The entry function in the lambda
   * @default handler
   */
  handler: string;
  /**
   * The name of the file containing the lambda code
   * The file must be put in the following structure
   * construct-folder/resources/lambda/my-cr-df.ts
   */
  entryFile: string;
  /**
   * Key-value pairs that Lambda caches and makes available for your Lambda
   * functions. Use environment variables to apply configuration changes, such
   * as test and production environment configurations, without changing your
   * Lambda function source code.
   *
   * @default - No environment variables.
   */

  environment?: { [key: string]: string };
}