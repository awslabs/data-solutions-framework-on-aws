// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataCatalogDatabase construct
 *
 * @group unit/data-catalog/data-catalog-database
 */

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataLakeCatalog, DataLakeStorage } from '../../../src';

describe('Create catalog for bronze, silver, gold', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const storage = new DataLakeStorage(stack, 'ExampleDLStorage');
  new DataLakeCatalog(stack, 'ExampleDLCatalog', {
    dataLakeStorage: storage,
    databaseName: 'example-db',
  });
  const template = Template.fromStack(stack);

  test('DataLakeCatalog should create 3 Glue database, one for each: Bronze, Silver, Gold', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp('^bronze-example-db\-.+'),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), '/example-db/'],

          ],
        },
      },
    });

    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp('^silver-example-db\-.+'),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), '/example-db/'],

          ],
        },
      },
    });

    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp('^gold-example-db\-.+'),
        LocationUri: {
          'Fn::Join': [
            '', ['s3://', Match.anyValue(), '/example-db/'],

          ],
        },
      },
    });
  });
});