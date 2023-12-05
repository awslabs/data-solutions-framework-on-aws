// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { TrackedConstructProps } from "./tracked-construct-props";
import { TrackedConstruct } from "./tracked-construct";
import { Aws, CustomResource, Duration } from "aws-cdk-lib";
import { Utils } from "./utils";
import { IFunction, Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { S3DataCopyProps } from "./s3-data-copy-props";
import { Provider } from "aws-cdk-lib/custom-resources";
import { ISubnet, IVpc } from "aws-cdk-lib/aws-ec2";


/**
 * Copy data from one S3 bucket to another.
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy
 */
export class S3DataCopy extends TrackedConstruct{

  /**
   * The Lambda function used to copy the data
   */
  public readonly copyLambda: IFunction;
  /**
   * The IAM role used by the lambda to copy the data
   */
  public readonly copyRole: IRole;
  /**
   * The VPC used to deploy the custom resource in when not provided
   */
  public readonly vpc?: IVpc;

  constructor(scope: Construct, id: string, props: S3DataCopyProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: S3DataCopy.name,
    };
    super(scope, id, trackedConstructProps);

    let subnets: ISubnet[];
    if (props.subnets === undefined) {
      // create a VPC and assign to this 
    } else { subnets = props.subnets }

    const path = this.node.scopes.slice(1).map(c => c.node.id).join('-');
    const functionName = `s3-data-copy${Utils.generateHash(path)}`;

    const managedPolicy = new ManagedPolicy(this, 'copyPolicy', {
      document: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
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
                'ec2:UnassignPrivateIpAddresses'
              ],
              effect: Effect.ALLOW,
              resources: ['*'],
            })
          ]
        }),
    })

    this.copyRole = props.iamRole || new Role(this, 'copyRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role used by S3DataCopy to copy data from one S3 bucket to another',
      managedPolicies: [managedPolicy]
    })

    props.sourceBucket.grantRead(this.copyRole,props.sourceBucketPrefix + '*');
    props.targetBucket.grantWrite(this.copyRole,props.targetBucketPrefix + '*');

    this.copyLambda = new Function(this, 'CopyLambda', {
      runtime: Runtime.NODEJS_LATEST,
      role: this.copyRole,
      code: Code.fromAsset("./resources/lambda/s3-data-copy/"),
      handler: "index.handler",
      timeout: Duration.minutes(15),
      environment: {
        "SOURCE_BUCKET_NAME": props.sourceBucket.bucketName,
        "SOURCE_BUCKET_PREFIX": props.sourceBucketPrefix,
        "SOURCE_BUCKET_REGION": props.sourceBucketRegion,
        "TARGET_BUCKET_NAME": props.targetBucket.bucketName,
        "TARGET_BUCKET_PREFIX": props.targetBucketPrefix,
      },
      vpcSubnets:,
    })
    // Custom resource provider
    const copyProvider = new Provider(this, 'CopyProvider', {
      onEventHandler: this.copyLambda 
    });

    // Custom resource to trigger copy
    new CustomResource(this, 'CopyCustomResource', {
      serviceToken: copyProvider.serviceToken
    });
  }  

}