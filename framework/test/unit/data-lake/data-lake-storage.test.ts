// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataLakeStorage construct
 *
 * @group unit/data-lake/data-lake-storage
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { DataLakeStorage } from '../../../src';


describe('DataLakeStorage Construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

  // Instantiate AccessLogsBucket Construct with default
  new DataLakeStorage(stack, 'DefaultDataLakeStorage');

  const customBronzeName = 'my-bronze';
  const customBronzeInfrequentAccessDelay = 90;
  const customBronzeArchiveDelay = 180;
  const customSilverName = 'my-silver';
  const customSilverInfrequentAccessDelay = 180;
  const customSilverArchiveDelay = 360;
  const customGoldName = 'my-gold';
  const customGoldInfrequentAccessDelay = 180;
  const customGoldArchiveDelay = 360;
  const customRemovalPolicy = RemovalPolicy.DESTROY;
  const dataLakeKey = new Key(stack, 'MyDataLakeKey');


  new DataLakeStorage(stack, 'CustomDataLakeStorage', {
    bronzeBucketName: customBronzeName,
    bronzeBucketInfrequentAccessDelay: customBronzeInfrequentAccessDelay,
    bronzeBucketArchiveDelay: customBronzeArchiveDelay,
    silverBucketName: customSilverName,
    silverBucketInfrequentAccessDelay: customSilverInfrequentAccessDelay,
    silverBucketArchiveDelay: customSilverArchiveDelay,
    goldBucketName: customGoldName,
    goldBucketInfrequentAccessDelay: customGoldInfrequentAccessDelay,
    goldBucketArchiveDelay: customGoldArchiveDelay,
    removalPolicy: customRemovalPolicy,
    dataLakeKey: dataLakeKey,
  });

  const template = Template.fromStack(stack);

  test('DataLakeStorage Construct', () => {
    template.resourceCountIs('AWS::S3::Bucket', 8);
  });

  test('DataLakeStorage should create the proper default KMS Key', () => {
    template.hasResource('AWS::KMS::Key',
      Match.objectLike({
        Properties: {
          EnableKeyRotation: true,
          KeyPolicy: {
            Statement: Match.arrayEquals([{
              Action: 'kms:*',
              Effect: 'Allow',
              Resource: '*',
              Principal: {
                AWS: {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':iam::',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':root',
                    ],
                  ],
                },
              },
            }]),
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('DataLakeStorage should create a bronze bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp('bronze-.*'),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: 90,
                  },
                  {
                    StorageClass: 'GLACIER',
                    TransitionInDays: 180,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp('bronze-.*'),
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('DataLakeStorage should create a gold bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp('gold-.*'),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: 180,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp('gold-.*'),
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('DataLakeStorage should create a silver bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp('silver-.*'),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: 180,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp('silver-.*'),
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  // Custom configuration testing
  test('DataLakeStorage should create a bronze bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp(`${customBronzeName}-.*`),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: customBronzeInfrequentAccessDelay,
                  },
                  {
                    StorageClass: 'GLACIER',
                    TransitionInDays: customBronzeArchiveDelay,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp(`${customBronzeName}-.*`),
          },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('DataLakeStorage should create a gold bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp(`${customGoldName}-.*`),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: customGoldInfrequentAccessDelay,
                  },
                  {
                    StorageClass: 'GLACIER',
                    TransitionInDays: customGoldArchiveDelay,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp(`${customGoldName}-.*`),
          },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('DataLakeStorage should create a silver bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: Match.stringLikeRegexp(`${customSilverName}-.*`),
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
            Rules: Match.arrayWith([
              Match.objectLike({
                Transitions: [
                  {
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: customSilverInfrequentAccessDelay,
                  },
                  {
                    StorageClass: 'GLACIER',
                    TransitionInDays: customSilverArchiveDelay,
                  },
                ],
                Status: 'Enabled',
              }),
            ]),
          },
          LoggingConfiguration: {
            DestinationBucketName: {
              Ref: Match.stringLikeRegexp('AccessLogsBucket.*'),
            },
            LogFilePrefix: Match.stringLikeRegexp(`${customSilverName}-.*`),
          },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});