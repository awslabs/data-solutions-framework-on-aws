---
sidebar_position: 1
sidebar_label: Data lake storage
---

# DataLakeStorage

This construct creates a storage layer for your data lake with AWS best-practices. At the high level, ***DataLakeStorage*** creates three [Amazon S3](https://aws.amazon.com/s3) buckets configured specifically for data lake on AWS. By default these buckets are named *Bronze*, *Silver*, and *Gold* to represent [different data layers](https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/data-layer-definitions.html). You can customize bucket names according to your needs.

## Overview

***DataLakeStorage*** uses [***AnalyticsBucket***](analytics-bucket) and [***AccessLogsBucket***](access-logs-bucket) constructs from AWS DSF, to create storage and access logs buckets respectively. Your data lake storage is encrypted using [AWS KMS](https://aws.amazon.com/kms/) customer key. You can also provide your own KMS Key. We provide data lifecycle management that you can customize to your needs. 

Here is the overview of ***DataLakeStorage*** features:
- Medalion design with S3 buckets for Bronze, Silver, and Gold data.
  - You can customize your bucket names.
- Server-side encryption using a single KMS customer key for all S3 buckets. 
  - You can provide your own KMS Key.
- Enforced SSL in-transit encryption.
- Logs data lake access in a dedicated bucket within a prefix matching the bucket name.
- Buckets and objects can be retained when the CDK resource is destroyed (default).
- All public access blocked.

![Data lake storage](../../../static/img/adsf-data-lake-storage.png)


### Objects removal

You can specify if buckets and objects should be deleted when the CDK resource is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications. 

Buckets and objects can be destroyed when the CDK resource is destroyed, if **both** data lake removal policy and AWS DSF global global removal policy are set to remove objects.

### How to set data removal policies
You can set `remove_data_on_destroy` (`true` or `false`) global data removal policy in `cdk.json` or in your CDK app:

```json title="cdk.json"
{
  "context": {
    "adsf": {
      "remove_data_on_destroy": "true"
    }
  }
}
```

Or you can set it in your CDK app:

```typescript title="CDK app"
const app = new App();
const stack = new Stack(app, 'Stack');
// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'true' });
```

You will also need to set removal policy for ***DataLakeStorage*** when using the construct:
```typescript
new DataLakeStorage(stack, 'CustomDataLakeStorage', {
...
  removalPolicy: RemovalPolicy.DESTROY,
...
}
```

### Data lifecycle management
We provide a simple [data lifecycle management](https://aws.amazon.com/s3/storage-classes/) for data lake storage, that you can customize to your needs. By default:
  - Bronze data is moved to Infrequent Access after 30 days and archived to Glacier after 90 days.
  - Silver and Gold data is moved to Infrequent Access after 90 days and is not archived.


### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import { DataLakeStorage } from 'aws-data-solutions-framework';

// Set context value for global data removal policy (or set in cdk.json).
stack.node.setContext('adsf', {'remove_data_on_destroy': 'false'});

new DataLakeStorage(stack, 'MyDataLakeStorage', {
  bronzeName: 'my-bronze',
  bronzeInfrequentAccessDelay: 90,
  bronzeArchiveDelay: 180,
  silverName: 'my-silver',
  silverInfrequentAccessDelay: 180,
  silverArchiveDelay: 360,
  goldName: 'my-gold',
  goldInfrequentAccessDelay: 180,
  goldArchiveDelay: 360,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```
