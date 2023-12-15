// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { ISubnet, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';


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
  readonly isCompleteHandlerDefinition: HandlerDefinition;

  readonly vpc: IVpc;

  readonly subnets: SubnetSelection;

  readonly queryInterval: any;

  readonly queryTimeout: any;
    
}

export interface HandlerDefinition {
  BundlingOption?: string;
  IamRole?: string;
  IamPolicy?: string;
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
}