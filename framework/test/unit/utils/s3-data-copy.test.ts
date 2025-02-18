// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { S3DataCopy } from '../../../src/utils';

/**
 * Tests S3DataCopy construct
 *
 * @group unit/s3-data-copy
 */

describe('With default configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const sourceBucket = Bucket.fromBucketName(stack, 'sourceBucket', 'nyc-tlc');
  const targetBucket = Bucket.fromBucketName(stack, 'destinationBucket', 'bronze');

  new S3DataCopy(stack, 'S3DataCopy', {
    sourceBucket,
    sourceBucketRegion: 'us-east-1',
    targetBucket,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an IAM role for the copy', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
      }),
    );
  });

  test('should create a lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: {
            SOURCE_BUCKET_NAME: 'nyc-tlc',
            SOURCE_BUCKET_PREFIX: '',
            SOURCE_BUCKET_REGION: 'us-east-1',
            TARGET_BUCKET_NAME: 'bronze',
            TARGET_BUCKET_PREFIX: '',
          },
        },
        Handler: 'index.handler',
        Role: {
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('S3DataCopyProviderOnEventHandlerRole.*'),
          ]),
        },
        Runtime: 'nodejs22.x',
      }),
    );
  });

  test('should create IAM policy for reading data from source', () =>{
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: [
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
              ],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': Match.arrayWith([
                    '',
                    Match.arrayWith([
                      ':s3:::nyc-tlc',
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      ':s3:::nyc-tlc/*',
                    ]),
                  ]),
                },
              ],
            },
            {
              Action: [
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
              ],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      ':s3:::bronze',
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      ':s3:::bronze/*',
                    ]),
                  ]),
                },
              ],
            },
          ]),
        },
      }));
  });
});

describe('With DESTROY removalPolicy and the global removal policy unset, the construct should', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const sourceBucket = Bucket.fromBucketName(stack, 'sourceBucket', 'nyc-tlc');
  const targetBucket = Bucket.fromBucketName(stack, 'destinationBucket', 'bronze');

  new S3DataCopy(stack, 'S3DataCopy', {
    sourceBucket,
    sourceBucketRegion: 'us-east-1',
    targetBucket,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('create a custom resource with Retain policy on delete', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
    template.hasResource('Custom::S3DataCopy',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe('With DESTROY removalPolicy and the global removal policy set to TRUE, the construct should', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const sourceBucket = Bucket.fromBucketName(stack, 'sourceBucket', 'nyc-tlc');
  const targetBucket = Bucket.fromBucketName(stack, 'destinationBucket', 'bronze');

  new S3DataCopy(stack, 'S3DataCopy', {
    sourceBucket,
    sourceBucketRegion: 'us-east-1',
    targetBucket,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('create a custom resource with Delete policy', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
    template.hasResource('Custom::S3DataCopy',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});