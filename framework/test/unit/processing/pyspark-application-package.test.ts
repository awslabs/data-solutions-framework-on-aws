// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests Spark runtime EMR Serverless construct
 *
 * @group unit/processing/pyspark-application-package
 */


import path from 'path';
import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PySparkApplicationPackage } from '../../../src/processing';


describe('With minimal configuration, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const appName = 'my-spark';

  new PySparkApplicationPackage (stack, 'PySparkPacker', {
    applicationName: appName,
    entrypointPath: path.join(__dirname, '../../resources/processing/pyspark-application-package/src/pyspark.py'),
    dependenciesFolder: path.join(__dirname, '../../resources/processing/pyspark-application-package'),
    venvArchivePath: '/output/pyspark.tar.gz',
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an artifact bucket with encryption and builtin access logs storage', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LoggingConfiguration: {
        LogFilePrefix: 'access-logs',
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  test('should create an artifact bucket with retain retention policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create an artifact bucket with encryption and builtin access logs storage', () => {
    template.hasResource('AWS::S3::Bucket', {
      Properties: Match.objectLike({
        LoggingConfiguration: {
          LogFilePrefix: 'access-logs',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      }),
    });
  });

  test('should create a managed policy with permissions to write logs to CloudWatch Logs', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      Description: 'Policy used by S3 deployment cdk construct for PySparkApplicationPackage',
      PolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': Match.arrayWith([
                [
                  'arn:aws:logs:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':*',
                ],
              ]),
            },
          }),
        ],
      }),
    });
  });

  test('should create a role for the bucket deployement custom resource assumed by Lambda', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      Description: 'Role used by S3 deployment cdk construct for PySparkApplicationPackage',
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
    });
  });

  test('should create a role for the bucket deployement custom resource with the managed policy attached', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      Description: 'Role used by S3 deployment cdk construct for PySparkApplicationPackage',
      ManagedPolicyArns: [
        {
          Ref: Match.stringLikeRegexp('.*s3BucketDeploymentPolicy.*'),
        },
      ],
    });
  });

  test('should attach read permissions to the deployment role on the asset bucket', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('.*s3BucketDeploymentRoleDefaultPolicy.*'),
      Roles: [
        {
          Ref: Match.stringLikeRegexp('s3BucketDeploymentRole'),
        },
      ],
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':s3:::',
                    {
                      'Fn::Sub': Match.stringLikeRegexp('cdk.*assets.*'),
                    },
                  ],
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':s3:::',
                    {
                      'Fn::Sub': Match.stringLikeRegexp('cdk.*assets.*'),
                    },
                    '/*',
                  ],
                ],
              },
            ],
          }),
        ]),
      }),
    });
  });

  test('should attach read and write permissions to the deployment role on the artifact bucket', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('.*s3BucketDeploymentRoleDefaultPolicy.*'),
      Roles: [
        {
          Ref: Match.stringLikeRegexp('s3BucketDeploymentRole'),
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
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('.*ArtifactBucket.*'),
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('.*ArtifactBucket.*'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            ],
          }),
        ]),
      }),
    });
  });

  test('should deploy the artifact into the artifact bucket', () => {
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SourceBucketNames: [
        {
          'Fn::Sub': Match.stringLikeRegexp('.*cdk.*assets.*'),
        },
      ],
      DestinationBucketName: {
        Ref: Match.stringLikeRegexp('.*ArtifactBucket.*'),
      },
      DestinationBucketKeyPrefix: `emr-artifacts/${appName}`,
    });
  });

  test('should deploy the dependencies into the artifact bucket', () => {
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SourceBucketNames: [
        {
          'Fn::Sub': Match.stringLikeRegexp('.*cdk.*assets.*'),
        },
      ],
      DestinationBucketName: {
        Ref: Match.stringLikeRegexp('.*ArtifactBucket.*'),
      },
      Extract: false,
      DestinationBucketKeyPrefix: `emr-artifacts/${appName}`,
    });
  });

});

describe('With removalPolicy.DESTROY configuration and no global removal policy set, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const appName = 'my-spark';

  new PySparkApplicationPackage (stack, 'PySparkPacker', {
    applicationName: appName,
    entrypointPath: path.join(__dirname, '../../resources/processing/pyspark-application-package/src/pyspark.py'),
    dependenciesFolder: path.join(__dirname, '../../resources/processing/pyspark-application-package'),
    venvArchivePath: '/output/pyspark.tar.gz',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an artifact bucket with retain retention policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With removalPolicy.DESTROY configuration and global removal policy set to DESTROY, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);

  const appName = 'my-spark';

  new PySparkApplicationPackage (stack, 'PySparkPacker', {
    applicationName: appName,
    entrypointPath: path.join(__dirname, '../../resources/processing/pyspark-application-package/src/pyspark.py'),
    dependenciesFolder: path.join(__dirname, '../../resources/processing/pyspark-application-package'),
    venvArchivePath: '/output/pyspark.tar.gz',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an artifact bucket with DESTROY retention policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});

describe('With no dependenciesFolder configuration, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const appName = 'my-spark';

  new PySparkApplicationPackage (stack, 'PySparkPacker', {
    applicationName: appName,
    entrypointPath: path.join(__dirname, '../../resources/processing/pyspark-application-package/src/pyspark.py'),
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should not create any deployment of deps', () => {
    template.resourceCountIs('Custom::CDKBucketDeployment', 1);
  });
});

