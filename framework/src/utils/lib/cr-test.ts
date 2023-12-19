// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { CustomResource } from 'aws-cdk-lib';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DsfProvider } from './dsf-provider';
import { S3DataCopyProps } from './s3-data-copy-props';
import { TrackedConstruct } from './tracked-construct';
import { TrackedConstructProps } from './tracked-construct-props';


/**
 * Copy data from one S3 bucket to another.
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy
 */
export class MyConstruct extends TrackedConstruct {

  //   private static readonly CR_RUNTIME = Runtime.NODEJS_20_X;
  //   private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;

  /**
   * The Lambda function used to copy the data
   */
  //public readonly copyLambda: IFunction;
  /**
   * The IAM role used by the lambda to copy the data
   */
  //public readonly executionRole: IRole;


  constructor(scope: Construct, id: string, props: S3DataCopyProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MyConstruct.name,
    };
    super(scope, id, trackedConstructProps);

    console.log(props.executionRole);

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

    let myProvider: DsfProvider = new DsfProvider(this, 'Provider', {
      providerName: 'crtest',
      onEventHandlerDefinition: {
        crManagedPolicy: managedPolicy,
        handler: 'index.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/index.mjs'),
        bundling: {
            nodeModules: [
              '@aws-sdk/client-s3',
              '@aws-sdk/client-sts',
              'json-validator',
              'qrcode'
            ],
            commandHooks: {
              afterBundling: () => [],
              beforeBundling: () => [
                'npx esbuild --version'
              ],
              beforeInstall: () => [
              ]
            }
          },
      },
    });

    // Custom resource to trigger copy
    new CustomResource(this, 'CustomResource', {
      serviceToken: myProvider.serviceToken,
      resourceType: 'Custom::CRTest',
    });
  }

}