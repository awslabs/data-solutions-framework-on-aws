// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests AccessLogsBucket construct
 *
 * @group unit/data-lake/access-logs-bucket
*/

import { Stack, RemovalPolicy, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { AccessLogsBucket } from '../../../src';


describe('AccessLogsBucket Construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Instantiate AccessLogsBucket Construct with default
  new AccessLogsBucket(stack, 'DefaultAccessLogsBucket');

  // Instantiate AccessLogsBucket Construct with custom parameters
  new AccessLogsBucket(stack, 'CustomAccessLogsBucket', {
    bucketName: 'custom-access-logs',
    encryption: BucketEncryption.KMS_MANAGED,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const template = Template.fromStack(stack);

  test('AccessLogsBucket should provision 2 buckets', () => {
    template.resourceCountIs('AWS::S3::Bucket', 2);
  });

  test('AccessLogsBucket should create a bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp('access-logs-.*'),
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('AccessLogsBucket should create a bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp('custom-access-logs-.*'),
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});
