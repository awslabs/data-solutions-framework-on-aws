// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataCatalogDatabase construct
 *
 * @group unit/data-catalog/data-catalog-database
 */

import assert from 'assert';
import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { DataCatalogDatabase } from '../../../src/data-catalog/data-catalog-database';

describe('DataCatalogDatabase default construct', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const dbBucketName = 'sample-db';
  const testPrincipalRoleName = 'test-principal';
  const dbBucket = new Bucket(stack, 'dbBucket', {
    bucketName: dbBucketName,
  });
  const testPrincipal = new Role(stack, 'testPrincipal', {
    assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    roleName: testPrincipalRoleName,
  });
  const locationPrefix = '/database';
  const dbName = 'sample';
  const catalogDb = new DataCatalogDatabase(stack, 'database', {
    locationBucket: dbBucket,
    locationPrefix: locationPrefix,
    name: dbName,
  });

  const grantReadonlyAccessResult = catalogDb.grantReadOnlyAccess(testPrincipal);

  const template = Template.fromStack(stack);
  test('DataCatalogDatabase should create catalog database', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp(`^${dbName}\-.+`),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), locationPrefix],

          ],
        },
      },
    });
  });

  test('DataCatalogDatabase should attach read only IAM policy to the test principal', () => {
    assert.equal(grantReadonlyAccessResult.statementAdded, true);
  });

  test('DataCatalogDatabase should create crawler execution role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'glue.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        {
          PolicyName: 'crawlerPermissions',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'glue:BatchCreatePartition',
                  'glue:BatchDeletePartition',
                  'glue:BatchDeleteTable',
                  'glue:BatchDeleteTableVersion',
                  'glue:BatchGetPartition',
                  'glue:BatchUpdatePartition',
                  'glue:CreatePartition',
                  'glue:CreateTable',
                  'glue:DeletePartition',
                  'glue:DeleteTable',
                  'glue:GetDatabase',
                  'glue:GetDatabases',
                  'glue:GetPartition',
                  'glue:GetPartitions',
                  'glue:GetTable',
                  'glue:GetTables',
                  'glue:UpdateDatabase',
                  'glue:UpdatePartition',
                  'glue:UpdateTable',
                ],
                Resource: [
                  {
                    'Fn::Join': [
                      '', [
                        'arn:aws:glue:',
                        Match.anyValue(),
                        ':',
                        Match.anyValue(),
                        ':catalog',
                      ],
                    ],
                  },
                  {
                    'Fn::Join': [
                      '', [
                        'arn:aws:glue:',
                        Match.anyValue(),
                        ':',
                        Match.anyValue(),
                        Match.stringLikeRegexp(`^\:database\/${dbName}\-.+`),
                      ],
                    ],
                  },
                  {
                    'Fn::Join': [
                      '', [
                        'arn:aws:glue:',
                        Match.anyValue(),
                        ':',
                        Match.anyValue(),
                        Match.stringLikeRegexp(`^\:table\/${dbName}\-.+`),
                      ],
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  });

  test('DataCatalogDatabase should create crawler', () => {
    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: Match.stringLikeRegexp(`^${dbName}\-.+`),
      Targets: {
        CatalogTargets: [
          {
            DatabaseName: Match.stringLikeRegexp(`^${dbName}\-.+`),
          },
        ],
      },
      Schedule: {
        ScheduleExpression: 'cron(1 0 * * * *)',
      },
    });
  });
});

describe('DataCatalogDatabase with disabled crawler', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const dbBucketName = 'sample-db';
  const dbBucket = new Bucket(stack, 'dbBucket', {
    bucketName: dbBucketName,
  });
  const locationPrefix = '/database';
  const dbName = 'sample';
  new DataCatalogDatabase(stack, 'database', {
    locationBucket: dbBucket,
    locationPrefix: locationPrefix,
    name: dbName,
    autoCrawl: false,
  });

  const template = Template.fromStack(stack);
  test('DataCatalogDatabase should create catalog database', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp(`^${dbName}\-.+`),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), locationPrefix],

          ],
        },
      },
    });
  });

  test('DataCatalogDatabase should not create crawler', () => {
    template.resourceCountIs('AWS::Glue::Crawler', 0);
  });
});

describe('DataCatalogDatabase with missing leading slash in the prefix', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const dbBucketName = 'sample-db';
  const dbBucket = new Bucket(stack, 'dbBucket', {
    bucketName: dbBucketName,
  });
  const locationPrefix = 'database';
  const dbName = 'sample';
  new DataCatalogDatabase(stack, 'database', {
    locationBucket: dbBucket,
    locationPrefix: locationPrefix,
    name: dbName,
  });

  const template = Template.fromStack(stack);
  test('DataCatalogDatabase should create catalog database', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp(`^${dbName}\-.+`),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), '/'+locationPrefix],

          ],
        },
      },
    });
  });
});