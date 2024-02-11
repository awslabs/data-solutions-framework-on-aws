// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests AthenaWorkGroup construct
 *
 * @group unit/athena-workgroup
 */

import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket } from 'aws-cdk-lib/aws-s3';

import { AthenaWorkGroup, ENGINE_DEFAULT_VERSION, EngineVersion } from '../../../src/consumption';


describe('AthenaWorkGroup default construct', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const wgName = 'test-athena-wg-default';
  const resultLocationPrefix = 'test-athena-wg';

  const athenaWorkGroup = new AthenaWorkGroup(stack, 'athenaWgDefault', {
    name: wgName,
    resultLocationPrefix,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const testPrincipal = new Role(stack, 'athenaWgTestPrincipal', {
    assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    roleName: 'testAthenaPrincipal',
  });

  athenaWorkGroup.grantRunQueries(testPrincipal);

  const template = Template.fromStack(stack);

  test('AthenaWorkGroup should create Athena workgroup', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      Name: Match.stringLikeRegexp('.*test-athena-wg-default.*'),
    });
  });

  test('should have the state enabled', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      State: 'ENABLED',
    });
  });

  test('should have default configuration', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      WorkGroupConfiguration: {
        EnforceWorkGroupConfiguration: true,
        EngineVersion: {
          SelectedEngineVersion: ENGINE_DEFAULT_VERSION,
        },
        ResultConfiguration: {
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_KMS',
            KmsKey: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('.*athenaWgDefaultAthenaResultKey.*'),
                'Arn',
              ],
            },
          },
          OutputLocation: {
            'Fn::Join': ['', ['s3://', Match.anyValue(), `/${resultLocationPrefix}/`]],
          },
        },
      },
    });
  });

  test('should create a KMS Key with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('should create an S3 Bucket with SSE KMS encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      }),
    );
  });

  test('should attach read only IAM policy to the test principal', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('.*athenaWgTestPrincipalDefaultPolicy.*'),
      Roles: [
        {
          Ref: Match.stringLikeRegexp('.*athenaWgTestPrincipal.*'),
        },
      ],
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
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
              Match.objectLike({
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('.*athenaWgDefaultAthenaBucket.*'),
                  'Arn',
                ],
              }),
              Match.objectLike({
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('.*athenaWgDefaultAthenaBucket.*'),
                        'Arn',
                      ],
                    },
                    Match.stringLikeRegexp('.*test-athena-wg\/\*'),
                  ],
                ],
              }),
            ],
          }),
          Match.objectLike({
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
            ],
            Effect: 'Allow',
            Resource: Match.objectLike({
              'Fn::GetAtt': [
                Match.stringLikeRegexp('.*athenaWgDefaultAthenaResultKey.*'),
                'Arn',
              ],
            }),
          }),
          Match.objectLike({
            Action: [
              'athena:ListEngineVersions',
              'athena:ListWorkGroups',
              'athena:ListDataCatalogs',
              'athena:ListDatabases',
              'athena:GetDatabase',
              'athena:ListTableMetadata',
              'athena:GetTableMetadata',
            ],
            Effect: 'Allow',
            Resource: '*',
          }),
          Match.objectLike({
            Action: [
              'athena:GetWorkGroup',
              'athena:BatchGetQueryExecution',
              'athena:GetQueryExecution',
              'athena:ListQueryExecutions',
              'athena:StartQueryExecution',
              'athena:StopQueryExecution',
              'athena:GetQueryResults',
              'athena:GetQueryResultsStream',
              'athena:CreateNamedQuery',
              'athena:GetNamedQuery',
              'athena:BatchGetNamedQuery',
              'athena:ListNamedQueries',
              'athena:DeleteNamedQuery',
              'athena:CreatePreparedStatement',
              'athena:GetPreparedStatement',
              'athena:ListPreparedStatements',
              'athena:UpdatePreparedStatement',
              'athena:DeletePreparedStatement',
            ],
            Effect: 'Allow',
            Resource:
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:athena:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    Match.stringLikeRegexp(`:workgroup/${wgName}.*`),
                  ],
                ],
              },
          }),
        ]),
      }),
    });
  });

  test('should not have role to access user resources in an Athena for Apache Spark session', () => {
    template.resourcePropertiesCountIs('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'athena.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        {
          PolicyName: 'athenaSparkPolicies',
        },
      ],
    }, 0);
  });

});

describe('AthenaWorkGroup construct with PySpark engine', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const wgName = 'test-athena-wg-spark';
  const resultLocationPrefix = 'test-athena-wg';

  new AthenaWorkGroup(stack, 'athenaWgDefault', {
    name: wgName,
    resultLocationPrefix,
    engineVersion: EngineVersion.PYSPARK_V3,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should have PySpark engine version', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      WorkGroupConfiguration: {
        EnforceWorkGroupConfiguration: true,
        EngineVersion: {
          SelectedEngineVersion: EngineVersion.PYSPARK_V3,
        },
      },
    });
  });

  test('should have role to access user resources in an Athena for Apache Spark session', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'athena.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        {
          PolicyName: 'athenaSparkPolicies',
        },
      ],
    });
  });

});

describe('AthenaWorkGroup with user provided result bucket and no key', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const wgName = 'test-athena-wg-exception';
  const resultLocationPrefix = 'test-athena-wg';

  const bucket = new Bucket(stack, 'TestBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
  });

  test('should fail and throw an exception', () => {
    expect(() => {
      new AthenaWorkGroup(stack, 'athenaWgException', {
        name: wgName,
        resultBucket: bucket,
        resultLocationPrefix,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }).toThrowError('Encryption key is required if you are providing your own results bucket.');
  });

});

describe('AthenaWorkGroup with user provided result bucket', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const wgName = 'test-athena-wg-bucket';
  const resultLocationPrefix = 'test-athena-wg';

  const encryptionKey = new Key(stack, 'userProvidedKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  const bucket = new Bucket(stack, 'userProvidedBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
  });

  new AthenaWorkGroup(stack, 'athenaWgException', {
    name: wgName,
    resultBucket: bucket,
    resultLocationPrefix,
    resultsEncryptionKey: encryptionKey,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should have configuration with provided bucket and key', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      WorkGroupConfiguration: {
        EnforceWorkGroupConfiguration: true,
        EngineVersion: {
          SelectedEngineVersion: ENGINE_DEFAULT_VERSION,
        },
        ResultConfiguration: {
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_KMS',
            KmsKey: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('.*userProvidedKey.*'),
                'Arn',
              ],
            },
          },
          OutputLocation: {
            'Fn::Join': [
              '',
              [
                's3://',
                Match.objectLike({ Ref: Match.stringLikeRegexp('.*userProvidedBucket.*') }),
                `/${resultLocationPrefix}/`,
              ],
            ],
          },
        },
      },
    });
  });

});

describe('AthenaWorkGroup with user provided key', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const wgName = 'test-athena-wg-userkey';
  const resultLocationPrefix = 'test-athena-wg';

  const encryptionKey = new Key(stack, 'userProvidedKey', {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
  });

  new AthenaWorkGroup(stack, 'athenaWgException', {
    name: wgName,
    bytesScannedCutoffPerQuery: 104857600,
    resultLocationPrefix,
    resultsEncryptionKey: encryptionKey,
    resultsRetentionPeriod: Duration.days(1),
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  console.log(template);

  test('should have configuration with provided bucket and key', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      WorkGroupConfiguration: {
        BytesScannedCutoffPerQuery: 104857600,
        EnforceWorkGroupConfiguration: true,
        EngineVersion: {
          SelectedEngineVersion: ENGINE_DEFAULT_VERSION,
        },
        ResultConfiguration: {
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_KMS',
            KmsKey: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('.*userProvidedKey.*'),
                'Arn',
              ],
            },
          },
          OutputLocation: {
            'Fn::Join': [
              '',
              [
                's3://',
                Match.objectLike({ Ref: Match.stringLikeRegexp('.*AthenaBucket.*') }),
                `/${resultLocationPrefix}/`,
              ],
            ],
          },
        },
      },
    });
  });

  test('should have retention period defined', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 1,
              Status: 'Enabled',
            },
            Match.anyValue(),
          ],
        },
      }),
    );
  });

  test('should create an S3 Bucket with user provided KMS Key', () => {
    template.hasResourceProperties('AWS::S3::Bucket',
      Match.objectLike({
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              BucketKeyEnabled: true,
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.objectLike({
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('.*userProvidedKey.*'),
                    'Arn',
                  ],
                }),
              },
            },
          ],
        },
      }),
    );
  });

});
