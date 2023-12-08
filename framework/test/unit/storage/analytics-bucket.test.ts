// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests AnalyticsBucket construct
 *
 * @group unit/data-lake/analytics-bucket
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { AnalyticsBucket } from '../../../src/storage';


describe('AnalyticsBucket Construct with default configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const encryptionKey = new Key(stack, 'DataKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  // Instantiate AnalyticsBucket Construct with default (encryptionKey is required)
  new AnalyticsBucket(stack, 'DefaultAnalyticsBucket', {
    encryptionKey,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test(' should create a bucket with a proper default configuration', () => {
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
          LifecycleConfiguration: {
            Rules: [
              {
                AbortIncompleteMultipartUpload: {
                  DaysAfterInitiation: 1,
                },
                Status: 'Enabled',
              },
            ],
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a bucket with a unique ID', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'analytics-',
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

  test(' should enforce SSL', () => {
    template.hasResource('AWS::S3::BucketPolicy',
      Match.objectLike({
        Properties: {
          Bucket: {
            Ref: Match.stringLikeRegexp('DefaultAnalyticsBucket.*'),
          },
          PolicyDocument: {
            Statement: [{
              Action: 's3:*',
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }],
          },
        },
      }),
    );
  });
});

describe('AnalyticsBucket Construct with custom configuration and DESTROY flag set to true', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const encryptionKey = new Key(stack, 'DataKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  // Instantiate AnalyticsBucket Construct with custom configuration
  new AnalyticsBucket(stack, 'CustomAnalyticsBucket', {
    bucketName: 'analytics-bucket',
    removalPolicy: RemovalPolicy.DESTROY,
    encryptionKey,
  });

  const template = Template.fromStack(stack);

  test(' with DESTROY removalPolicy should destroy objects', () => {
    template.hasResource('Custom::S3AutoDeleteObjects',
      Match.objectLike({
        Properties: {
          BucketName: {
            Ref: Match.stringLikeRegexp('CustomAnalyticsBucket.*'),
          },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
    // Set autoDeleteObjects only if DESTROY flag is true && Removal policy is DESTROY
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
  });

  test(' with DESTROY removalPolicy should be destroyed if global removal policy is true', () => {
    // Stack has no a warning about the mismatch between removal policies
    Annotations.fromStack(stack).hasNoWarning('*', Match.stringLikeRegexp('WARNING: removalPolicy was reverted back to'));

    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: 'analytics-bucket',
        },
        DeletionPolicy: 'Delete',
      }),
    );
  });
});

describe('AnalyticsBucket Construct with DESTROY flag set to false', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', false);

  const encryptionKey = new Key(stack, 'DataKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  // Instantiate AnalyticsBucket Construct with custom configuration
  new AnalyticsBucket(stack, 'CustomAnalyticsBucket', {
    bucketName: 'analytics-bucket',
    encryptionKey: encryptionKey,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test(' should not destroy objects if DESTROY flag is false', () => {
    // Set autoDeleteObjects only if DESTROY flag is true && Removal policy is DESTROY
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 0);
  });

  test(' with DESTROY removalPolicy should not be destroyed if global removal policy is false', () => {
    // Stack has a warning about the mismatch between removal policies
    Annotations.fromStack(stack).hasWarning('*', Match.stringLikeRegexp('WARNING: removalPolicy was reverted back to'));

    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: 'analytics-bucket',
        },
        DeletionPolicy: 'Retain',
      }),
    );
  });

});

describe('Use AnalyticsBucket without setting a global data removal policy', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const encryptionKey = new Key(stack, 'DataKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  // Instantiate AnalyticsBucket Construct with custom configuration
  new AnalyticsBucket(stack, 'CustomAnalyticsBucket', {
    bucketName: 'analytics-bucket',
    encryptionKey: encryptionKey,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test(' should not destroy objects if DESTROY flag is true but global data removal policy is not set', () => {
    // Set autoDeleteObjects only if DESTROY flag is true && Removal policy is DESTROY
    template.resourceCountIs('Custom::S3AutoDeleteObjects', 0);
  });

});

describe('2 AnalyticsBucket Constructs in the same stack', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const encryptionKey = new Key(stack, 'DataKey');

  new AnalyticsBucket(stack, 'DefaultAnalyticsBucket1', {
    encryptionKey,
  });

  new AnalyticsBucket(stack, 'DefaultAnalyticsBucket2', {
    encryptionKey,
  });

  const template = Template.fromStack(stack);

  test(' should create the first bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'analytics-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              Match.stringLikeRegexp('-3112410f'),
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
              'analytics-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              Match.stringLikeRegexp('-c5586a19'),
            ],
          ],
        },
      }),
    );
  });
});

