// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Fn, RemovalPolicy } from 'aws-cdk-lib';
import { CfnCrawler } from 'aws-cdk-lib/aws-glue';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { DataCatalogDatabase } from './data-catalog-database';
import { AnalyticsBucket, DataLakeStorage } from '../storage';
import { Context, TrackedConstruct, TrackedConstructProps } from '../utils';

/**
* Creates AWS Glue Catalog Database for each storage layer. Composed of 3 {@link DataCatalogDatabase} for Bronze, Silver, and Gold data.
*
* @example
* import * as cdk from 'aws-cdk-lib';
* import { Key } from 'aws-cdk-lib/aws-kms';
* import { DataLakeCatalog, DataLakeStorage } from 'aws-data-solutions-framework';
*
* const exampleApp = new cdk.App();
* const stack = new cdk.Stack(exampleApp, 'DataCatalogStack');
* const storage = new DataLakeStorage(stack, "ExampleStorage");
* const logEncryptionKey = new Key(stack, 'LogEncryptionKey');
* const dataLakeCatalog = new DataLakeCatalog(stack, "ExampleDataLakeCatalog", {
*   dataLakeStorage: storage,
*   databaseName: "exampledb",
*   crawlerLogEncryptionKey: logEncryptionKey
* })
*/
export class DataLakeCatalog extends TrackedConstruct {
  readonly bronzeCatalogDatabase: DataCatalogDatabase;
  readonly silverCatalogDatabase: DataCatalogDatabase;
  readonly goldCatalogDatabase: DataCatalogDatabase;
  readonly crawlerLogEncryptionKey?: Key;

  /**
   * Constructs a new instance of DataLakeCatalog
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {DataLakeCatalogProps} props the DataLakeCatalog properties
   */
  constructor(scope: Construct, id: string, props: DataLakeCatalogProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataLakeCatalog.name,
    };

    super(scope, id, trackedConstructProps);
    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    if (props.autoCrawl) {
      this.crawlerLogEncryptionKey = props.crawlerLogEncryptionKey || new Key(this, 'CrawlerLogKey', {
        enableKeyRotation: true,
        removalPolicy: removalPolicy,
      });
    }

    const extractedBronzeBucketName = this.extractBucketName(props.dataLakeStorage.bronzeBucket);
    const extractedSilverBucketName = this.extractBucketName(props.dataLakeStorage.silverBucket);
    const extractedGoldBucketName = this.extractBucketName(props.dataLakeStorage.goldBucket);
    const locationPrefix = props.databaseName || '/';

    this.bronzeCatalogDatabase = new DataCatalogDatabase(this, 'BronzeCatalogDatabase', {
      locationBucket: props.dataLakeStorage.bronzeBucket,
      locationPrefix,
      name: props.databaseName ? `${extractedBronzeBucketName}_${props.databaseName}` : extractedBronzeBucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      crawlerTableLevelDepth: props.crawlerTableLevelDepth,
      removalPolicy,
    });

    this.silverCatalogDatabase = new DataCatalogDatabase(this, 'SilverCatalogDatabase', {
      locationBucket: props.dataLakeStorage.silverBucket,
      locationPrefix,
      name: props.databaseName ? `${extractedSilverBucketName}_${props.databaseName}` : extractedSilverBucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      crawlerTableLevelDepth: props.crawlerTableLevelDepth,
      removalPolicy,
    });

    this.goldCatalogDatabase = new DataCatalogDatabase(this, 'GoldCatalogDatabase', {
      locationBucket: props.dataLakeStorage.goldBucket,
      locationPrefix,
      name: props.databaseName ? `${extractedGoldBucketName}_${props.databaseName}` : extractedGoldBucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      crawlerTableLevelDepth: props.crawlerTableLevelDepth,
      removalPolicy,
    });
  }

  /**
   * Extract the bucket prefix from the {@link AnalyticsBucket} bucket name.
   * @param {AnalyticsBucket} bucket
   * @returns
   */
  private extractBucketName(bucket: AnalyticsBucket): string {
    const tokens = Fn.split('-', bucket.bucketName);
    return Fn.select(0, tokens);
  }
}

/**
 * Properties for the DataLakeCatalog Construct
 */
export interface DataLakeCatalogProps {

  /**
   * Location of data lake files
   */
  readonly dataLakeStorage: DataLakeStorage;

  /**
   * The name of the database in the Glue Data Catalog. This is also used as the prefix inside the data lake bucket.
   * @default Use the bucket name as the database name and / as the prefix
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
  readonly crawlerLogEncryptionKey?: Key;

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