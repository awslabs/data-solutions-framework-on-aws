// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Names, RemovalPolicy, UniqueResourceNameOptions } from 'aws-cdk-lib';
import { Bucket, BucketProps, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Aws } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

import { Context } from '../utils';

/**
 * Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.
 *
 * @example
 * import * as cdk from 'aws-cdk-lib';
 * import { AccessLogsBucket } from 'aws-data-solutions-framework';
 *
 * const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
 *  removalPolicy: RemovalPolicy.DESTROY,
 * })
 */
export class AccessLogsBucket extends Bucket {
  constructor(scope: Construct, id: string, props?: BucketProps) {

    const bucketName = props?.bucketName || ('access-logs' + '-' + Aws.ACCOUNT_ID + '-' + Aws.REGION);
    const removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    const autoDeleteObjects = removalPolicy == RemovalPolicy.DESTROY;

    const uniqueResourceNameOptions: UniqueResourceNameOptions = {
      maxLength: 60 - bucketName.length,
    };

    super(scope, id, {
      ...props,
      bucketName: bucketName + '-' + Names.uniqueResourceName(scope, uniqueResourceNameOptions).toLowerCase(),
      encryption: props?.encryption || BucketEncryption.S3_MANAGED,
      enforceSSL: props?.enforceSSL || true,
      blockPublicAccess: props?.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects,
    });
  }

}