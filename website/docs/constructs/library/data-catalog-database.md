---
sidebar_position: 2
sidebar_label: Data catalog database
---

# DataCatalogDatabase

![Data lake storage](../../../static/img/adsf-data-catalog.png)

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