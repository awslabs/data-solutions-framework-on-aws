// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Fn } from 'aws-cdk-lib';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { DataCatalogDatabase } from './data-catalog-database';
import { DataLakeCatalogProps } from './data-lake-catalog-props';
import { AnalyticsBucket } from '../../storage';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../utils';

/**
* Creates AWS Glue Catalog Database for each storage layer. Composed of 3 {@link DataCatalogDatabase} for Bronze, Silver, and Gold data.
* @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/data-lake-catalog
 *
* @example
* import { Key } from 'aws-cdk-lib/aws-kms';
*
* const logEncryptionKey = new Key(this, 'LogEncryptionKey');
* const storage = new dsf.storage.DataLakeStorage(this, "ExampleStorage");
* const dataLakeCatalog = new dsf.governance.DataLakeCatalog(this, "ExampleDataLakeCatalog", {
*   dataLakeStorage: storage,
*   databaseName: "exampledb",
*   crawlerLogEncryptionKey: logEncryptionKey
* })
*/
export class DataLakeCatalog extends TrackedConstruct {
  /**
   * The Glue Database for Bronze bucket
   */
  readonly bronzeCatalogDatabase: DataCatalogDatabase;
  /**
   * The Glue Database for Silver bucket
   */
  readonly silverCatalogDatabase: DataCatalogDatabase;
  /**
   * The Glue Database for Gold bucket
   */
  readonly goldCatalogDatabase: DataCatalogDatabase;
  /**
   * The KMS Key used to encrypt the crawler logs.
   */
  readonly crawlerLogEncryptionKey?: IKey;

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