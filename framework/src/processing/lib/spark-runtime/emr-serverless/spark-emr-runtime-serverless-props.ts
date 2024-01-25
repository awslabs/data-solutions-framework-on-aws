// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { aws_emrserverless, IResolvable, RemovalPolicy } from 'aws-cdk-lib';
import { EmrRuntimeVersion } from '../../../../processing';
import { Architecture } from '../../../../utils';

/**
 * Properties for the `SparkEmrServerlessRuntime` construct
 */
export interface SparkEmrServerlessRuntimeProps {
  /**
   * The different custom image configurations used for the Spark Driver and the Spark Executor
   * @see https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/application-custom-image.html
   * @default - EMR base image is used for both the Spark Driver and the Spark Executor
   */
  readonly workerTypeSpecifications?:
  IResolvable |
  Record<string, IResolvable |
  aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty>;
  /**
   * The network configuration for customer VPC connectivity for the application.
   * If no configuration is created, the a VPC with 3 public subnets and 3 private subnets is created
   * The 3 public subnets and 3 private subnets are each created in an Availability Zone (AZ)
   * The VPC has one NAT Gateway per AZ and an S3 endpoint
   * @default - a VPC and a security group are created, these are accessed as construct attribute.
   */
  readonly networkConfiguration?: IResolvable | aws_emrserverless.CfnApplication.NetworkConfigurationProperty;
  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
  /**
   * The name of the application. The name must be less than 64 characters.
   * *Pattern* : `^[A-Za-z0-9._\\/#-]+$`
   */
  readonly name: string;
  /**
   * The maximum capacity of the application.
   * This is cumulative across all workers at any given point in time during the lifespan of the application is created. No new resources will be created once any one of the defined limits is hit.
   * @default - Depending on the EMR version
   */
  readonly maximumCapacity?: IResolvable | aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty;
  /**
   * The pre-initialized capacity of the application.
   * @see https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/pre-init-capacity.html
   * @default - No pre-initialized capacity is used
   */
  readonly initialCapacity?: IResolvable | Array<IResolvable | aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty>;
  /**
   * The unique custom image configuration used for both the Spark Driver and the Spark Executor.
   * @see https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/application-custom-image.html
   * @default - EMR base image is used for both the Spark Driver and the Spark Executor
   */
  readonly imageConfiguration?: IResolvable | aws_emrserverless.CfnApplication.ImageConfigurationInputProperty;
  /**
   * The runtime and monitoring configurations to used as defaults for all of the job runs of this application.
   * @see https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/default-configs.html
   * @default - No custom configuration is used
   */
  readonly runtimeConfiguration?: IResolvable | aws_emrserverless.CfnApplication.ConfigurationObjectProperty[];
  /**
   * The configuration for an application to automatically stop after a certain amount of time being idle.
   * @default - The application is stopped after 15 minutes of idle time
   */
  readonly autoStopConfiguration?: IResolvable | aws_emrserverless.CfnApplication.AutoStopConfigurationProperty;
  /**
   * The configuration for an application to automatically start on job submission.
   * @default - True
   */
  readonly autoStartConfiguration?: IResolvable | aws_emrserverless.CfnApplication.AutoStartConfigurationProperty;
  /**
   *
   * The CPU architecture type of the application.
   * @default - x86_64
   */
  readonly architecture?: Architecture;
  /**
   * The EMR release version associated with the application.
   * The EMR release can be found in this [documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-components.html)
   * @default [EMR_DEFAULT_VERSION](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/emr-releases.ts#L46)
   */
  readonly releaseLabel?: EmrRuntimeVersion;
}