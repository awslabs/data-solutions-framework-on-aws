// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Bucket } from 'aws-cdk-lib/aws-s3';

/// !show
class ExampleDefaultS3DataCopyStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const sourceBucket = Bucket.fromBucketName(this, 'sourceBucket', 'nyc-tlc');
    const targetBucket = Bucket.fromBucketName(this, 'destinationBucket', 'staging-bucket');
    
    new dsf.utils.S3DataCopy(this, 'S3DataCopy', {
      sourceBucket,
      sourceBucketPrefix: 'trip data/',
      sourceBucketRegion: 'us-east-1',
      targetBucket,
      targetBucketPrefix: 'staging-data/',
    });
  }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultS3DataCopyStack(app, 'ExampleDefaultS3DataCopy');