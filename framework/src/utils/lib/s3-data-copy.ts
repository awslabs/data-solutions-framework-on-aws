// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { CustomResource } from 'aws-cdk-lib';
import { ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Context } from './context';
import { DsfProvider } from './dsf-provider';
import { S3DataCopyProps } from './s3-data-copy-props';
import { TrackedConstruct } from './tracked-construct';
import { TrackedConstructProps } from './tracked-construct-props';


/**
 * Copy data from one S3 bucket to another.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Utils/s3-data-copy
 *
 * @example
 * import { Bucket } from 'aws-cdk-lib/aws-s3';
 *
 * const sourceBucket = Bucket.fromBucketName(this, 'SourceBucket', 'nyc-tlc');
 * const bucketName = `test-${this.region}-${this.account}-${dsf.utils.Utils.generateUniqueHash(this, 'TargetBucket')}`;
 *
 * const targetBucket = new Bucket(this, 'TargetBucket');
 *
 * new dsf.utils.S3DataCopy(this, 'S3DataCopy', {
 *   sourceBucket,
 *   sourceBucketPrefix: 'trip data/',
 *   sourceBucketRegion: 'us-east-1',
 *   targetBucket,
 * });
 */
export class S3DataCopy extends TrackedConstruct {

  /**
   * The CloudWatch Log Group for the S3 data copy
   */
  public readonly copyLogGroup: ILogGroup;
  /**
   * The IAM Role for the copy Lambba Function
   */
  public readonly copyRole: IRole;
  /**
   * The Lambda Function for the copy
   */
  public readonly copyFunction: IFunction;
  /**
   * The list of EC2 Security Groups used by the Lambda Functions
   */
  public readonly securityGroups?: ISecurityGroup[];
  /**
   * The CloudWatch Log Group for the S3 data copy cleaning up lambda
   */
  public readonly cleanUpLogGroup?: ILogGroup;
  /**
   * The Lambda function for the S3 data copy cleaning up lambda
   */
  public readonly cleanUpFunction?: IFunction;
  /**
   * The IAM Role for the the S3 data copy cleaning up lambda
   */
  public readonly cleanUpRole?: IRole;

  constructor(scope: Construct, id: string, props: S3DataCopyProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: S3DataCopy.name,
    };
    super(scope, id, trackedConstructProps);

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    if (props.vpc === undefined && props.subnets !==undefined) {
      throw new Error('S3DataCopy error: if VPC parameter is not configured, subnets cannot be');
    }
    if (props.vpc !== undefined && props.subnets === undefined) {
      throw new Error('S3DataCopy error: if VPC parameter is configured, subnets must be');
    }

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 's3-data-copy',
      onEventHandlerDefinition: {
        handler: 'index.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/s3-data-copy/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/s3-data-copy/index.mjs'),
        environment: {
          SOURCE_BUCKET_NAME: props.sourceBucket.bucketName,
          SOURCE_BUCKET_PREFIX: props.sourceBucketPrefix || '',
          SOURCE_BUCKET_REGION: props.sourceBucketRegion,
          TARGET_BUCKET_NAME: props.targetBucket.bucketName,
          TARGET_BUCKET_PREFIX: props.targetBucketPrefix || '',
        },
        bundling: {
          externalModules: ['aws-sdk'],
          nodeModules: ['@aws-sdk/client-s3'],
        },
      },
      vpc: props.vpc,
      subnets: props.vpc ? props.subnets : undefined,
      securityGroups: props.vpc ? props.securityGroups : undefined,
      removalPolicy,
    });
    this.copyRole = provider.onEventHandlerRole;
    this.copyLogGroup = provider.onEventHandlerLogGroup;
    this.copyFunction = provider.onEventHandlerFunction;
    this.securityGroups = provider.securityGroups;
    this.cleanUpLogGroup = provider.cleanUpLogGroup;
    this.cleanUpFunction = provider.cleanUpFunction;
    this.cleanUpRole = provider.cleanUpRole;

    props.sourceBucket.grantRead(this.copyRole, `${props.sourceBucketPrefix || ''}*`);
    props.targetBucket.grantWrite(this.copyRole, `${props.targetBucketPrefix || ''}*`);

    // Custom resource to trigger copy
    new CustomResource(this, 'CustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::S3DataCopy',
      removalPolicy,
    });
  }

}