// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataCatalogDatabase construct
 *
 * @group unit/data-catalog/data-catalog-database
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataLakeCatalog } from '../../../src/governance';
import { DataLakeStorage } from '../../../src/storage'; {}

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
  // console.log(JSON.stringify(template.toJSON(), null, 2));
  test('should create a KMS Key with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
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
  stack.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);
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