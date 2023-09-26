// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnCrawler } from 'aws-cdk-lib/aws-glue';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { DataCatalogDatabase } from './data-catalog-database';
import { DataLakeStorage } from '../storage';
import { Context, TrackedConstruct, TrackedConstructProps } from '../utils';

/**
* Creates AWS Glue Catalog Database for each storage layer. Composed of 3 {@link DataCatalogDatabase} for Bronze, Silver, and Gold data.
*
* @example
* import * as cdk from 'aws-cdk-lib';
* import { DataLakeCatalog, DataLakeStorage } from 'aws-data-solutions-framework';
*
* const exampleApp = new cdk.App();
* const stack = new cdk.Stack(exampleApp, 'DataCatalogStack');
* const storage = new DataLakeStorage(stack, "ExampleStorage");
* const dataLakeCatalog = new DataLakeCatalog(stack, "ExampleDataLakeCatalog", {
*   bronze: {
*       name: "bronze-database",
*       locationPrefix: "exampleBronzeDatabase/",
*       locationBucket: storage.bronzeBucket
*   },
*   silver: {
*       name: "silver-database",
*       locationPrefix: "exampleSilverDatabase/",
*       locationBucket: storage.silverBucket
*   },
*   gold: {
*       name: "gold-database",
*       locationPrefix: "exampleGoldDatabase/",
*       locationBucket: storage.goldBucket
*   }
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

    this.bronzeCatalogDatabase = new DataCatalogDatabase(this, 'BronzeCatalogDatabase', {
      locationBucket: props.dataLakeStorage.bronzeBucket,
      locationPrefix: props.databaseName || '/',
      name: props.databaseName ? `bronze-${props.databaseName}` : props.dataLakeStorage.bronzeBucket.bucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      removalPolicy,
    });

    this.silverCatalogDatabase = new DataCatalogDatabase(this, 'SilverCatalogDatabase', {
      locationBucket: props.dataLakeStorage.silverBucket,
      locationPrefix: props.databaseName || '/',
      name: props.databaseName ? `silver-${props.databaseName}` : props.dataLakeStorage.silverBucket.bucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      removalPolicy,
    });

    this.goldCatalogDatabase = new DataCatalogDatabase(this, 'GoldCatalogDatabase', {
      locationBucket: props.dataLakeStorage.goldBucket,
      locationPrefix: props.databaseName || '/',
      name: props.databaseName ? `gold-${props.databaseName}` : props.dataLakeStorage.goldBucket.bucketName,
      autoCrawl: props.autoCrawl,
      autoCrawlSchedule: props.autoCrawlSchedule,
      crawlerLogEncryptionKey: this.crawlerLogEncryptionKey,
      removalPolicy,
    });
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
   * Policy to apply when the bucket is removed from this stack.
   * * @default - RETAIN (The bucket will be orphaned).
   */
  readonly removalPolicy?: RemovalPolicy;
}