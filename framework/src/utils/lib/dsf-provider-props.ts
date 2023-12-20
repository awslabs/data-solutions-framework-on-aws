// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IManagedPolicy, IPolicy, IRole, ManagedPolicy, Policy, Role } from 'aws-cdk-lib/aws-iam';
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
  IamRole?: IRole;
  crPolicy?: IPolicy;
  crManagedPolicy?: IManagedPolicy;
  /**
   * The name of the file containing the deps lockfile
   * The file must be put in the following structure
   * construct-folder/resources/lambda/package-lock.json
   */
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
   * Key-value pairs to define environment variables to apply configuration changes.
   *
   * @default - No environment variables.
   */

  environment?: { [key: string]: string };
}