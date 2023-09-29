// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_emrserverless, IResolvable, RemovalPolicy } from 'aws-cdk-lib';
import { EmrRuntimeVersion } from '../../../utils';

/**
 * Properties for the {SparkRuntimeServerless} construct
 */
export interface SparkEmrServerlessRuntimeProps {
  /**
   * The container image to use in the application. If none is provided the application will use the base Amazon EMR Serverless image for the specified EMR release.
   * This is an [example](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/application-custom-image.html) of usage
   */
  readonly workerTypeSpecifications?:
  IResolvable |
  Record<string, IResolvable |
  aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty>;
  /**
   * The network configuration for customer VPC connectivity for the application.
   * If no configuration is created, the a VPC with 3 public subnets and 3 private subnets is created
   * The VPC has a NAT Gateway and an S3 endpoint
   */
  readonly networkConfiguration?: IResolvable | aws_emrserverless.CfnApplication.NetworkConfigurationProperty;
  /**
   * If no VPC is provided, it is created with vpc flowlog activated
   * This prop control if the logs should be deleted when the stack is deleted
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly vpcFlowlogRemovalPolicy?: RemovalPolicy;
  /**
   * The name of the application. The name must be less than 64 characters.
   *
   * *Pattern* : `^[A-Za-z0-9._\\/#-]+$`
   */
  readonly name: string;
  /**
   * The maximum capacity of the application.
   * This is cumulative across all workers at any given point in time during the lifespan of the application is created. No new resources will be created once any one of the defined limits is hit.
   */
  readonly maximumCapacity?: IResolvable | aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty;
  /**
   * The initial capacity of the application.
   */
  readonly initialCapacity?: IResolvable | Array<IResolvable | aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty>;
  /**
   * The image configuration.
   */
  readonly imageConfiguration?: IResolvable | aws_emrserverless.CfnApplication.ImageConfigurationInputProperty;
  /**
   * The configuration for an application to automatically stop after a certain amount of time being idle.
   */
  readonly autoStopConfiguration?: IResolvable | aws_emrserverless.CfnApplication.AutoStopConfigurationProperty;
  /**
   * The configuration for an application to automatically start on job submission.
   */
  readonly autoStartConfiguration?: IResolvable | aws_emrserverless.CfnApplication.AutoStartConfigurationProperty;
  /**
   *
   * The CPU architecture type of the application.
   */
  readonly architecture?: Architecture;
  /**
   * The EMR release version associated with the application.
   * The EMR release can be found in this [documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html)
   * @default @see EMR_DEFAULT_VERSION
   */
  readonly releaseLabel?: EmrRuntimeVersion;
}

/**
 * Enum defining the CPU architecture type of the application, either  X86_64 or ARM64.
 */
export enum Architecture {
  X86_64 = 'X86_64',
  ARM64 = 'ARM64'
}