---
sidebar_position: 1
sidebar_label: Data lake storage
---

# DataLakeStorage

Data Lake based on medallion architecture and AWS best-practices.

## Overview

At the high level, `DataLakeStorage` creates three [Amazon S3](https://aws.amazon.com/s3) buckets configured specifically for data lake on AWS. By default these buckets are named *Bronze*, *Silver*, and *Gold* to represent [different data layers](https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/data-layer-definitions.html). You can customize bucket names according to your needs.
`DataLakeStorage` uses [`AnalyticsBucket`](analytics-bucket) and [`AccessLogsBucket`](access-logs-bucket) constructs from AWS DSF, to create storage and access logs buckets respectively. Your data lake storage is encrypted using [AWS KMS](https://aws.amazon.com/kms/) a default customer managed key. You can also provide your own KMS Key. We provide data lifecycle management that you can customize to your needs. 

Here is the overview of `DataLakeStorage` features:
- Medalion design with S3 buckets for Bronze, Silver, and Gold data.
- Server-side encryption using a single KMS customer key for all S3 buckets. 
- Enforced SSL in-transit encryption.
- Logs data lake access in a dedicated bucket within a prefix matching the bucket name.
- Buckets, objects and encryption keys can be retained when the CDK resource is destroyed (default).
- All public access blocked.

![Data lake storage](../../../static/img/adsf-data-lake-storage.png)

## Usage

```python
from aws_cdk import (
  App, 
  Stack, 
)
from aws_dsf import DataLakeStorage

app = App()
stack = Stack(app, 'DataLakeStorageStack')

DataLakeStorage(stack, 'MyDataLakeStorage')
```
## Bucket naming

The construct ensures the default bucket names uniqueness which is a [pre-requisite](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html) to create Amazon S3 buckets. 
To achieve this, the construct is creating the default bucket names like `<LAYER>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>` where:
 * `<LAYER>` is the layer in the medallion architecture (bronze, silver or gold).
 * `<AWS_ACCOUNT_ID>` and `<AWS_REGION>` are the account ID and region where you deploy the construct.
 * `<UNIQUEID>` is an 8 characters unique ID calculated based on the CDK path.

If you provide the `bucketName` parameter, you need to ensure the name is globaly unique. 
Alternatively, you can use the `BucketUtils.generateUniqueBucketName()` utility method to create unique names. 
This method generates a unique name based on the provided name, the construct ID and the CDK scope:
 * The bucket name is suffixed the AWS account ID, the AWS region and an 8 character hash of the CDK path. 
 * The maximum length for the bucket name is 26 characters.

```python
from aws_cdk import (
  App, 
  Stack, 
)
from aws_dsf import DataLakeStorage, BucketUtils

app = App()
stack = Stack(app, 'DataLakeStorageStack')

DataLakeStorage(stack, 'MyDataLakeStorage',
                bronze_bucket_name=BucketUtils.generate_unique_bucket_name(stack, 'MyDataLakeStorage', 'my-custom-bronze'))
```

## Objects removal

You can specify if buckets, objects and encryption keys should be deleted when the CDK resource is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications. 

Buckets, objects and encryption keys can be destroyed when the CDK resource is destroyed only if **both** data lake removal policy and AWS DSF global removal policy are set to remove objects.

You can set `@aws-data-solutions-framework/removeDataOnDestroy` (`true` or `false`) global data removal policy in `cdk.json`:

```json title="cdk.json"
{
  "context": {
    "@aws-data-solutions-framework/removeDataOnDestroy": true,
  }
}
```

Or programmatically in your CDK app:

```python title="CDK app"
app = App()
stack = Stack(app, 'Stack')
# Set context value for global data removal policy
stack.node.set_context('@aws-data-solutions-framework/removeDataOnDestroy', True)
```

You will also need to set removal policy for `DataLakeStorage` when using the construct:
```python
DataLakeStorage(stack, 'DataLakeStorage',
  # ...
  removal_policy=RemovalPolicy.DESTROY,
  # ...
)

```

## Data lifecycle management
We provide a simple [data lifecycle management](https://aws.amazon.com/s3/storage-classes/) for data lake storage, that you can customize to your needs. By default:
  - Bronze data is moved to Infrequent Access after 30 days and archived to Glacier after 90 days.
  - Silver and Gold data is moved to Infrequent Access after 90 days and is not archived.

Change the data lifecycle rules using the DataLakeStorage properties:

```python
DataLakeStorage(stack, 'MyDataLakeStorage',
                bronze_infrequent_access_delay=90,
                bronze_archive_delay=180,
                silver_infrequent_access_delay=180,
                silver_archive_delay=360,
                gold_infrequent_access_delay=180,
                gold_archive_delay=360)
```
