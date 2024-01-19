// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests AccessLogsBucket construct
 *
 * @group unit/data-lake/access-logs-bucket
*/

import { Stack, RemovalPolicy, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { AccessLogsBucket } from '../../../src/storage';


describe('AccessLogsBucket Construct with default configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new AccessLogsBucket(stack, 'DefaultAccessLogsBucket');

  const template = Template.fromStack(stack);

  test(' should create a bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
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

  test(' should create a bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'accesslogs-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              Match.stringLikeRegexp('-[a-z0-9]{8}$'),
            ],
          ],
        },
      }),
    );
  });
});

describe('AccessLogsBucket Construct with custom configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with custom parameters
  new AccessLogsBucket(stack, 'CustomAccessLogsBucket', {
    bucketName: 'accesslogs',
    encryption: BucketEncryption.KMS_MANAGED,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const template = Template.fromStack(stack);

  test(' should create a bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: 'accesslogs',
      }),
    );
  });

  test(' should create a bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
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

describe('2 AccessLogsBucket Constructs in the same stack', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Instantiate AccessLogsBucket Construct with default
  new AccessLogsBucket(stack, 'DefaultAccessLogsBucket1');

  new AccessLogsBucket(stack, 'DefaultAccessLogsBucket2');

  const template = Template.fromStack(stack);

  test(' should create the first bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'accesslogs-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              Match.stringLikeRegexp('-13f876de'),
            ],
          ],
        },
      }),
    );
  });

  test(' should create the second bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'accesslogs-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              Match.stringLikeRegexp('-919542aa'),
            ],
          ],
        },
      }),
    );
  });
});
