// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';


/**
 * @internal
 * The properties for the DsfProvider construct
 */

export interface DsfProviderProps {

  /**
   * The policy to apply when the custom resource is removed from the stack.
   * @default - RETAIN. The resources will not be deleted.
   */
  readonly removalPolicy?: RemovalPolicy;
  /**
   * The name of the custom resource provider
   */
  readonly providerName: string;
  /**
   * Handler definition for onEvent function.
   */
  readonly onEventHandlerDefinition: HandlerDefinition;
  /**
   * Handler definition for isComplete function.
   * @default - No isComplete function is used.
   */
  readonly isCompleteHandlerDefinition?: HandlerDefinition;
  /**
   * The VPC wherein to run the lambda functions.
   * @default - Lambda functions are executed in VPC owned by AWS Lambda service.
   */
  readonly vpc?: IVpc;
  /**
   * The subnet wherein to run the lambda functions.
   * @default - the Vpc default strategy if not specified
   */
  readonly subnets?: SubnetSelection;
  /**
   * The list of security groups to attach to the lambda functions.
   * The security groups MUST be exclusively used by the custom resource.
   * @default - If `vpc` is not supplied, no security groups are attached. Otherwise, a dedicated security
   * group is created for each function.
   */
  readonly securityGroups?: ISecurityGroup [];
  /**
   * Time between calls to the `isComplete` handler which determines if the
   * resource has been stabilized.
   * @default Duration.seconds(5)
   */
  readonly queryInterval?: Duration;
  /**
   * Total timeout for the entire custom resource operation.
   * The maximum timeout is 1 hour.
   * @default Duration.minutes(30)
   */
  readonly queryTimeout?: Duration;

}

export interface HandlerDefinition {

  /**
   * The bundling options to use for the lambda function.
   * @default - Use default bundling options from `NodejsFunction`.
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html#bundling
   */
  readonly bundling?: BundlingOptions;
  /**
   * The role used by the lamnda function
   * @default - A new role is created.
   */
  readonly iamRole?: IRole;
  /**
   * The IAM managed poicy to attach to the lambda function.
   * The policy must grant all the permissions required to run the custom resource except logging.
   * Permissions for logging in CloudWatch Logs are already granted by the construct.
   * @default - no policy is attached to the execution role
   */
  readonly managedPolicy?: IManagedPolicy;
  /**
   * The name of the file containing the deps lockfile.
   * The file must be put in the following structure
   * construct-folder/resources/lambda/package-lock.json
   */
  readonly depsLockFilePath: string;
  /**
   * The entry function in the lambda
   */
  readonly handler: string;
  /**
   * The name of the file containing the lambda code.
   * The file must be put in the following structure
   * construct-folder/resources/lambda/my-cr-df.ts
   */
  readonly entryFile: string;
  /**
   * Key-value pairs to define environment variables to apply configuration changes.
   * @default - No environment variables.
   */
  readonly environment?: { [key: string]: string };
  /**
   * The timeout for the lambda function.
   * @default - Duration.minutes(14)
   */
  readonly timeout?: Duration;
}