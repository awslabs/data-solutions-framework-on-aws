---
sidebar_position: 4
sidebar_label: Data catalog database
---

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

```python
from aws_cdk import (
  App, 
  Stack, 
)
from aws_data_solutions_framework import DataCatalogDatabase

app = App()
stack = Stack(app, 'DataCatalogStack')

DataCatalogDatabase(stack, 'ExampleDatabase',
                    location_bucket=bucket,
                    location_prefix='/databasePath',
                    name='example-db')
```
## Modifying the crawler behavior

You can change the default configuration of the AWS Glue Crawler to match your requirements:
* Enable or disable the crawler
* Change the crawler run frequency
* Provide your own key to encrypt the crawler logs

```python
my_key = Key(stack, 'CrawlerLogsKey')

DataCatalogDatabase(stack, 'ExampleDatabase',
                    location_bucket=bucket,
                    location_prefix='/databasePath',
                    name='example-db',
                    auto_crawl=True,
                    auto_crawl_schedule='cron(1 0 * * ? *)',
                    crawler_log_encryption_key=my_key,
                    )
```
