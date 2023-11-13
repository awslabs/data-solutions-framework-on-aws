// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnCrawler } from 'aws-cdk-lib/aws-glue';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';

/**
 * The Database catalog properties
 */
export interface DataCatalogDatabaseProps {
  /**
   * Database name. Construct would add a randomize suffix as part of the name to prevent name collisions.
   */
  readonly name: string;

  /**
   * S3 bucket where data is stored
   */
  readonly locationBucket: IBucket;

  /**
   * Top level location wwhere table data is stored.
   */
  readonly locationPrefix: string;

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