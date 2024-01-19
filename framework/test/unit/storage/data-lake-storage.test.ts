// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataLakeStorage construct
 *
 * @group unit/data-lake/data-lake-storage
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { DataLakeStorage } from '../../../src/storage';


describe('DataLakeStorage Construct with defaults', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Instantiate AccessLogsBucket Construct with default
  new DataLakeStorage(stack, 'DefaultDataLakeStorage');

  const template = Template.fromStack(stack);

  test(' should create 4 buckets', () => {
    template.resourceCountIs('AWS::S3::Bucket', 4);
  });

  test(' should create the proper default KMS Key', () => {
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

  test(' should create a bronze bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: {
            'Fn::Join': [
              '',
              [
                'bronze-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: {
              'Fn::Join': [
                '',
                [
                  'bronze-',
                  { Ref: 'AWS::AccountId' },
                  '-',
                  { Ref: 'AWS::Region' },
                  Match.stringLikeRegexp('-[a-z0-9]{8}$'),
                ],
              ],
            },
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a gold bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: {
            'Fn::Join': [
              '',
              [
                'gold-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: {
              'Fn::Join': [
                '',
                [
                  'gold-',
                  { Ref: 'AWS::AccountId' },
                  '-',
                  { Ref: 'AWS::Region' },
                  Match.stringLikeRegexp('-[a-z0-9]{8}$'),
                ],
              ],
            },
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a silver bucket with proper default configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: {
            'Fn::Join': [
              '',
              [
                'silver-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: {
              'Fn::Join': [
                '',
                [
                  'silver-',
                  { Ref: 'AWS::AccountId' },
                  '-',
                  { Ref: 'AWS::Region' },
                  Match.stringLikeRegexp('-[a-z0-9]{8}$'),
                ],
              ],
            },
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe('DataLakeStorage Construct with default KMS Key, DESTROY removal policy and global data removal set to TRUE', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new DataLakeStorage(stack, 'DefaultDataLakeStorage', {
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create a KMS Key with DELETE removal policy', () => {
    template.hasResource('AWS::KMS::Key',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test(' should create a bronze bucket with DELETE removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'bronze-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test(' should create a silver bucket with DELETE removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'silver-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test(' should create a gold bucket with DELETE removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'gold-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test(' should not WARN the user that the policy has been reverted', () => {
    Annotations.fromStack(stack).hasNoWarning('*', Match.stringLikeRegexp('WARNING: removalPolicy was reverted back to'));
  });
});

describe('DataLakeStorage Construct with default KMS Key, DESTROY removal policy and global data removal unset', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Instantiate AccessLogsBucket Construct with default
  new DataLakeStorage(stack, 'DefaultDataLakeStorage', {
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create a KMS Key with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a bronze bucket with RETAIN removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'bronze-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a silver bucket with RETAIN removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'silver-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should create a gold bucket with RETAIN removal policy', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: Match.objectLike({
          BucketName: {
            'Fn::Join': [
              '',
              [
                'gold-',
                { Ref: 'AWS::AccountId' },
                '-',
                { Ref: 'AWS::Region' },
                Match.stringLikeRegexp('-[a-z0-9]{8}$'),
              ],
            ],
          },
        }),
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test(' should WARN the user that the policy has been reverted', () => {
    Annotations.fromStack(stack).hasWarning('*', Match.stringLikeRegexp('WARNING: removalPolicy was reverted back to'));
  });
});

describe('DataLakeStorage Construct with custom KMS and lifecycle rules configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const customBronzeName = 'my-bronze';
  const customBronzeInfrequentAccessDelay = 90;
  const customBronzeArchiveDelay = 180;
  const customSilverName = 'my-silver';
  const customSilverInfrequentAccessDelay = 180;
  const customSilverArchiveDelay = 360;
  const customGoldName = 'my-gold';
  const customGoldInfrequentAccessDelay = 180;
  const customGoldArchiveDelay = 360;
  const dataLakeKey = new Key(stack, 'MyDataLakeKey', {
    description: 'test key',
  });


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
    dataLakeKey: dataLakeKey,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test(' should not create a KMS key', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key',
      Match.objectLike({
        Description: 'test key',
      }),
    );
  });

  test(' should create a bronze bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: customBronzeName,
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: customBronzeName,
          },
        },
      }),
    );
  });

  test(' should create a gold bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: customGoldName,
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: customGoldName,
          },
        },
      }),
    );
  });

  test(' should create a silver bucket with proper custom configuration', () => {
    template.hasResource('AWS::S3::Bucket',
      Match.objectLike({
        Properties: {
          BucketName: customSilverName,
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
              Ref: Match.stringLikeRegexp('.*AccessLogsBucket.*'),
            },
            LogFilePrefix: customSilverName,
          },
        },
      }),
    );
  });
});

describe('2 DataLakeStorageConstructs in the same stack', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  new DataLakeStorage(stack, 'Default1');

  new DataLakeStorage(stack, 'Default2');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test(' should create the first bucket with unique ID in the name', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketName: {
          'Fn::Join': [
            '',
            [
              'bronze-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              '-63a68b7c',
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
              'bronze-',
              { Ref: 'AWS::AccountId' },
              '-',
              { Ref: 'AWS::Region' },
              '-e95697ce',
            ],
          ],
        },
      }),
    );
  });
});

