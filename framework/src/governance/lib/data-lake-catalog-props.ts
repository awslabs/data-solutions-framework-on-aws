// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnCrawler } from 'aws-cdk-lib/aws-glue';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { DataLakeStorage } from '../../storage';

/**
 * Properties for the DataLakeCatalog Construct
 */
export interface DataLakeCatalogProps {

  /**
   * Location of data lake files
   */
  readonly dataLakeStorage: DataLakeStorage;

  /**
   * The suffix of the database in the Glue Data Catalog. The name of the database is composed of the bucket name and this suffix.
   * The suffix is also added to the S3 location inside the data lake buckets.
   * @default Use the bucket name as the database name and / as the S3 location
   */
  readonly databaseName?: string;

  /**
   * When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter.
   * @default True
   */
  readonly autoCrawl?: boolean;

  /**
   * The schedule when the Crawler would run. Default is once a day at 00:01h.
   * @default `cron(1 0 * * ? *)`
   */
  readonly autoCrawlSchedule?: CfnCrawler.ScheduleProperty;

  /**
   * Encryption key used for Crawler logs
   * @default Create a new key if none is provided
   */
  readonly crawlerLogEncryptionKey?: IKey;

  /**
   * Directory depth where the table folders are located. This helps the crawler understand the layout of the folders in S3.
   * @default calculated based on `locationPrefix`
   */
  readonly crawlerTableLevelDepth?: number;

  /**
   * Policy to apply when the bucket is removed from this stack.
   * * @default - RETAIN (The bucket will be orphaned).
   */
  readonly removalPolicy?: RemovalPolicy;
}