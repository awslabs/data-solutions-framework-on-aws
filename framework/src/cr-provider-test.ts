// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { MyConstruct, Utils } from './utils';

const app = new App();
const stack = new Stack(app, 'TestStack');

const sourceBucket = Bucket.fromBucketName(stack, 'SourceBucket', 'nyc-tlc');
const bucketName = `test-${stack.region}-${stack.account}-${Utils.generateUniqueHash(stack, 'TargetBucket')}`;

const targetBucket = new Bucket(stack, 'TargetBucket', {
  bucketName,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

new MyConstruct(stack, 'S3DataCopy', {
  sourceBucket,
  sourceBucketPrefix: 'trip data/',
  sourceBucketRegion: 'us-east-1',
  targetBucket,
});

new CfnOutput(stack, 'Target', {
  value: targetBucket.bucketName,
});