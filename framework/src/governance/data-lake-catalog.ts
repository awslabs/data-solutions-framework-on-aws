// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { DataCatalogDatabase, DataCatalogDatabaseProps } from './data-catalog-database';
import { TrackedConstruct, TrackedConstructProps } from '../utils';

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

    this.bronzeCatalogDatabase = new DataCatalogDatabase(this, 'BronzeCatalogDatabase', props.bronze);

    this.silverCatalogDatabase = new DataCatalogDatabase(this, 'SilverCatalogDatabase', props.silver);

    this.goldCatalogDatabase = new DataCatalogDatabase(this, 'GoldCatalogDatabase', props.gold);
  }
}

/**
 * Properties for the DataLakeCatalog Construct
 */
export interface DataLakeCatalogProps {
  /**
     * Properties for the bronze data
     */
  readonly bronze: DataCatalogDatabaseProps;

  /**
     * Properties for the silver data
     */
  readonly silver: DataCatalogDatabaseProps;

  /**
     * Properties for the gold data
     */
  readonly gold: DataCatalogDatabaseProps;
}