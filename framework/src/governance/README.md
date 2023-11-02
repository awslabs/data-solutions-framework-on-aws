[//]: # (governance.data-catalog-database)
# DataCatalogDatabase

AWS Glue Catalog database for an Amazon S3 dataset.

## Overview

`DataCatalogDatabase` is an [AWS Glue Data Catalog Database](https://docs.aws.amazon.com/glue/latest/dg/define-database.html) configured for an Amazon S3 based dataset:
- The database default location is pointing to an S3 bucket location `s3://<locationBucket>/<locationPrefix>/`
- The database can store various tables structured in their respective prefixes, for example: `s3://<locationBucket>/<locationPrefix>/<table_prefix>/`
- By default, a database level crawler is scheduled to run once a day (00:01h local timezone). The crawler can be disabled and the schedule/frequency of the crawler can be modified with a cron expression.

![Data Catalog Database](../../../static/img/adsf-data-catalog.png)

:::caution Data Catalog encryption
The AWS Glue Data Catalog resources created by the `DataCatalogDatabase` construct are not encrypted because the encryption is only available at the catalog level. Changing the encryption at the catalog level has a wide impact on existing Glue resources and producers/consumers. Similarly, changing the encryption configuration at the catalog level after this construct is deployed can break all the resources created as part of AWS DSF.
:::caution

## Usage

[example default usage](./examples/data-catalog-database-default.lit.ts)

## Modifying the crawler behavior

You can change the default configuration of the AWS Glue Crawler to match your requirements:
* Enable or disable the crawler
* Change the crawler run frequency
* Provide your own key to encrypt the crawler logs

[example crawler configuration](./examples/data-catalog-database-crawler.lit.ts)

[//]: # (governance.data-lake-catalog)
# DataLakeCatalog

AWS Glue Catalog databases on top of a DataLakeStorage.

## Overview

`DataLakeCatalog` is a data catalog for your data lake. It's a set of [AWS Glue Data Catalog Databases](https://docs.aws.amazon.com/glue/latest/dg/define-database.html) configured on top of a [`DataLakeStorage`](./data-lake-storage.mdx).
The construct creates three databases pointing to the respective medallion layers (bronze, silve or gold) of the `DataLakeStorage`:
- The database default location is pointing to the corresponding S3 bucket location `s3://<locationBucket>/<locationPrefix>/`
- By default, each database has an active crawler scheduled to run once a day (00:01h local timezone). The crawler can be disabled and the schedule/frequency of the crawler can be modified with a cron expression.

![Data Lake Catalog](../../../static/img/adsf-data-lake-catalog.png)

:::caution Data Catalog encryption
The AWS Glue Data Catalog resources created by the `DataCatalogDatabase` construct are not encrypted because the encryption is only available at the catalog level. Changing the encryption at the catalog level has a wide impact on existing Glue resources and producers/consumers. Similarly, changing the encryption configuration at the catalog level after this construct is deployed can break all the resources created as part of AWS DSF.
:::caution

## Usage

[example default usage](./examples/data-lake-catalog-default.lit.ts)

## Modifying the crawlers behavior for the entire catalog

You can change the default configuration of the AWS Glue Crawlers associated with the different databases to match your requirements:
* Enable or disable the crawlers
* Change the crawlers run frequency
* Provide your own key to encrypt the crawlers logs

The parameters apply to the three databases, if you need fine-grained configuration per database, you can use the [DataCatalogDatabase](./data-catalog-database) construct.

[example crawler configuration](./examples/data-lake-catalog-crawler.lit.ts)
