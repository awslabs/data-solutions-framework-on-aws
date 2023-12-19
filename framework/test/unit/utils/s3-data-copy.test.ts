// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App, Stack } from 'aws-cdk-lib';
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

  test('should create a managed policy with least privileges', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      Match.stringLikeRegexp('\:log-group\:\/aws\/lambda\/s3-data-copy\-.*'),
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      Match.stringLikeRegexp('\:log\-group\:\/aws\/lambda\/s3\-data\-copy\-.*\:log\-stream\:\*'),
                    ]),
                  ]),
                },
              ],
            },
            {
              Action: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
        }),
      }),
    );
  });

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
        Description: 'Role used by S3DataCopy to copy data from one S3 bucket to another',
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
            // AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
        Handler: 'index.handler',
        Role: {
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('S3DataCopyRole.*'),
          ]),
        },
        Runtime: 'nodejs20.x',
        Timeout: 900,
      }),
    );
  });

  test('should set proper log retention for the custom resource', () => {
    template.hasResourceProperties('Custom::LogRetention',
      Match.objectLike({
        LogGroupName: {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              '/aws/lambda/',
              {
                Ref: Match.stringLikeRegexp('S3DataCopyLambda.*'),
              },
            ]),
          ]),
        },
        RetentionInDays: 7,
      }),
    );
  });

  test('should create IAM policy for reading data from source', () =>{
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: {
          Statement: [
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
          ],
        },
      }));
  });
});