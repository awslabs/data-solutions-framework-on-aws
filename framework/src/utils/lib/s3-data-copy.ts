// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { CustomResource } from 'aws-cdk-lib';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
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
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy
 */
export class S3DataCopy extends TrackedConstruct {

  /**
   * The Lambda function for copying data
   */
  public readonly copyFunction: IFunction;

  /**
   * The IAM role used by the Lambda function to copy data
   */
  public readonly copyFunctionRole: IRole;
  /**
   * The CloudWatch LogGroup used by the Lambda function to copy data
   */
  public readonly copyFunctionLogGroup: ILogGroup;


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

    const managedPolicy = new ManagedPolicy(this, 'Policy', {
      document: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
              'ec2:AssignPrivateIpAddresses',
              'ec2:UnassignPrivateIpAddresses',
            ],
            effect: Effect.ALLOW,
            resources: ['*'],
          }),
        ],
      }),
    });

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 's3-data-copy',
      onEventHandlerDefinition: {
        handler: 'index.handler',
        managedPolicy,
        depsLockFilePath: path.join(__dirname, './resources/lambda/s3-data-copy/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/s3-data-copy/index.mjs'),
        environment: {
          SOURCE_BUCKET_NAME: props.sourceBucket.bucketName,
          SOURCE_BUCKET_PREFIX: props.sourceBucketPrefix || '',
          SOURCE_BUCKET_REGION: props.sourceBucketRegion,
          TARGET_BUCKET_NAME: props.targetBucket.bucketName,
          TARGET_BUCKET_PREFIX: props.targetBucketPrefix || '',
        },
      },
      vpc: props.vpc,
      subnets: props.vpc ? { subnets: props.subnets } : undefined,
      removalPolicy,
    });
    this.copyFunction = provider.onEventHandlerFunction;
    this.copyFunctionRole = provider.onEventHandlerRole;
    this.copyFunctionLogGroup = provider.onEventHandlerLog;

    props.sourceBucket.grantRead(this.copyFunctionRole, `${props.sourceBucketPrefix || ''}*`);
    props.targetBucket.grantWrite(this.copyFunctionRole, `${props.targetBucketPrefix || ''}*`);

    // Custom resource to trigger copy
    new CustomResource(this, 'CustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::S3DataCopy',
      removalPolicy,
    });
  }

}