// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataCatalogDatabase construct
 *
 * @group unit/data-catalog/data-catalog-database
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataLakeCatalog } from '../../../src/governance';
import { DataLakeStorage } from '../../../src/storage';

describe ('Create catalog for bronze, silver, gold with no provided databaseName', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const storage = new DataLakeStorage(stack, 'ExampleDLStorage', { removalPolicy: RemovalPolicy.DESTROY });
  new DataLakeCatalog(stack, 'ExampleDLCatalog', {
    dataLakeStorage: storage,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  test('should create crawlers that uses the bucketName as part of the prefix', () => {
    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Gold.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  's3://',
                  {
                    Ref: Match.stringLikeRegexp('.+?Gold.+'),
                  },
                  '/',
                  {
                    'Fn::Select': [
                      0,
                      {
                        'Fn::Split': [
                          '-',
                          {
                            Ref: Match.stringLikeRegexp('.+?Gold.+'),
                          },
                        ],
                      },
                    ],
                  },
                  '/',
                ],
              ],
            },
          },
        ],
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Silver.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  's3://',
                  {
                    Ref: Match.stringLikeRegexp('.+?Silver.+'),
                  },
                  '/',
                  {
                    'Fn::Select': [
                      0,
                      {
                        'Fn::Split': [
                          '-',
                          {
                            Ref: Match.stringLikeRegexp('.+?Silver.+'),
                          },
                        ],
                      },
                    ],
                  },
                  '/',
                ],
              ],
            },
          },
        ],
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Bronze.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  's3://',
                  {
                    Ref: Match.stringLikeRegexp('.+?Bronze.+'),
                  },
                  '/',
                  {
                    'Fn::Select': [
                      0,
                      {
                        'Fn::Split': [
                          '-',
                          {
                            Ref: Match.stringLikeRegexp('.+?Bronze.+'),
                          },
                        ],
                      },
                    ],
                  },
                  '/',
                ],
              ],
            },
          },
        ],
      },
    });
  });
});

describe('Create catalog for bronze, silver, gold with no global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const storage = new DataLakeStorage(stack, 'ExampleDLStorage', { removalPolicy: RemovalPolicy.DESTROY });
  new DataLakeCatalog(stack, 'ExampleDLCatalog', {
    dataLakeStorage: storage,
    databaseName: 'exampledb',
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

  test('should create crawlers that uses the databaseName', () => {
    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Gold.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  Match.exact('s3://'),
                  Match.anyValue(),
                  Match.exact('/exampledb/'),
                ],
              ],
            },
          },
        ],
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Silver.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  Match.exact('s3://'),
                  Match.anyValue(),
                  Match.exact('/exampledb/'),
                ],
              ],
            },
          },
        ],
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                0,
                {
                  'Fn::Split': [
                    '-',
                    {
                      Ref: Match.stringLikeRegexp('.+?Bronze.+'),
                    },
                  ],
                },
              ],
            },
            Match.anyValue(),
          ],
        ],
      },
      Targets: {
        S3Targets: [
          {
            Path: {
              'Fn::Join': [
                '',
                [
                  Match.exact('s3://'),
                  Match.anyValue(),
                  Match.exact('/exampledb/'),
                ],
              ],
            },
          },
        ],
      },
    });
  });


  test('DataLakeCatalog should create 3 Glue database, one for each: Bronze, Silver, Gold', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: {
          'Fn::Join': [
            '', [Match.anyValue(), Match.stringLikeRegexp('^_exampledb\_.+')],
          ],
        },
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), '/exampledb/'],

          ],
        },
      },
    });
  });
});

describe('Create catalog for bronze, silver, gold with global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
  const storage = new DataLakeStorage(stack, 'ExampleDLStorage', { removalPolicy: RemovalPolicy.DESTROY });
  new DataLakeCatalog(stack, 'ExampleDLCatalog', {
    dataLakeStorage: storage,
    databaseName: 'exampledb',
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
});