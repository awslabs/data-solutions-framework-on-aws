---
sidebar_position: 4
sidebar_label: Data catalog database
---

# DataCatalogDatabase

An AWS Glue Data Catalog Database configured with the following:
- Default location using the following defaults: `s3://<locationBucket>/<locationPrefix>/`
- Inside the location would be the various tables structured in their respective prefixes, for example: `s3://<locationBucket>/<locationPrefix>/<table_prefix>/`
- The default would create a database level crawler that's scheduled to run once a day (00:01h). This can be overriden to either disable the crawler or control the schedule/frequency of the crawler execution.

## Overview

![Data Catalog Database](../../../static/img/adsf-data-catalog.png)

## Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import { DataCatalogDatabase } from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'DataCatalogStack');

new DataCatalogDatabase(stack, 'ExampleDatabase', {
  locationBucket: bucket,
  locationPrefix: '/databasePath',
  name: 'example-db'
});
```