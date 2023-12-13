// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { Aws, CustomResource, Duration } from 'aws-cdk-lib';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, IFunction, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { S3DataCopyProps } from './s3-data-copy-props';
import { TrackedConstruct } from './tracked-construct';
import { TrackedConstructProps } from './tracked-construct-props';
import { Utils } from './utils';


/**
 * Copy data from one S3 bucket to another.
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy
 */
export class S3DataCopy extends TrackedConstruct {

  private static readonly CR_RUNTIME = Runtime.NODEJS_20_X;
  private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;

  /**
   * The Lambda function used to copy the data
   */
  public readonly copyLambda: IFunction;
  /**
   * The IAM role used by the lambda to copy the data
   */
  public readonly executionRole: IRole;


  constructor(scope: Construct, id: string, props: S3DataCopyProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: S3DataCopy.name,
    };
    super(scope, id, trackedConstructProps);

    if (props.vpc === undefined && props.subnets !==undefined) {
      throw new Error('S3DataCopy error: if VPC parameter is not configured, subnets cannot be');
    }
    if (props.vpc !== undefined && props.subnets === undefined) {
      throw new Error('S3DataCopy error: if VPC parameter is configured, subnets must be');
    }

    const functionName = `s3-data-copy-${Utils.generateScopeHash(this)}`;

    const managedPolicy = new ManagedPolicy(this, 'Policy', {
      document: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            resources: [
              `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}`,
              `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/${functionName}:log-stream:*`,
            ],
          }),
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

    this.executionRole = props.executionRole || new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role used by S3DataCopy to copy data from one S3 bucket to another',
    });
    this.executionRole.addManagedPolicy(managedPolicy);

    props.sourceBucket.grantRead(this.executionRole, `${props.sourceBucketPrefix || ''}*`);
    props.targetBucket.grantWrite(this.executionRole, `${props.targetBucketPrefix || ''}*`);

    this.copyLambda = new Function(this, 'Lambda', {
      runtime: S3DataCopy.CR_RUNTIME,
      role: this.executionRole,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, './resources/lambda/s3-data-copy/')),
      timeout: Duration.minutes(15),
      environment: {
        SOURCE_BUCKET_NAME: props.sourceBucket.bucketName,
        SOURCE_BUCKET_PREFIX: props.sourceBucketPrefix || '',
        SOURCE_BUCKET_REGION: props.sourceBucketRegion,
        TARGET_BUCKET_NAME: props.targetBucket.bucketName,
        TARGET_BUCKET_PREFIX: props.targetBucketPrefix || '',
      },
      vpc: props.vpc,
      vpcSubnets: props.vpc ? { subnets: props.subnets } : undefined,
      logRetention: S3DataCopy.LOG_RETENTION,
    });
    // Custom resource provider
    const copyProvider = new Provider(this, 'Provider', {
      onEventHandler: this.copyLambda,
      logRetention: S3DataCopy.LOG_RETENTION,
    });

    // Custom resource to trigger copy
    new CustomResource(this, 'CustomResource', {
      serviceToken: copyProvider.serviceToken,
      resourceType: 'Custom::S3DataCopy',
    });
  }

}