---
sidebar_position: 3
sidebar_label: Access logs bucket
---

# AccessLogsBucket

Amazon S3 Bucket configured for S3 access logs storage.

## Overview

`AccessLogsBucket` construct is an Amazon S3 Bucket configured with best practices and smart defaults for storing S3 access logs:
- The default bucket name is <CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>
- The bucket encryption is S3 Managed.
- Public access is blocked.
- Two-step protection for bucket and objects deletion.
- SSL communication is enforced.

`AccessLogsBucket` extends the Amazon [S3 `Bucket`](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_s3/Bucket.html#bucket) CDK Construct. For custom requirements that are not covered, use the `Bucket` construct directly.


## Usage

```python
from aws_cdk import (
  App, 
  Stack, 
  RemovalPolicy, 
)
from aws_dsf import AccessLogsBucket
from aws_cdk.aws_kms import Key

app = App()
stack = Stack(app, 'AccessLogsBucketStack')

AccessLogsBucket(self, 'AccessLogsBucket',
                         removal_policy=RemovalPolicy.DESTROY)
```

## Bucket Naming

The construct ensures bucket name uniqueness globally which is a [pre-requisite](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html) to create Amazon S3 buckets. 
To achieve this, the construct is creating bucket names like `<BUCKET_NAME>-<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>` where:
 * `<BUCKET_NAME>` is the property passed as the `bucket_name` to the constructor. If not provided the name will be in the form of `<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>`.
 * `<CDK_ID>` is the ID used in the CDK application and passed as the `id` parameter to the constructor.
 * `<AWS_ACCOUNT_ID>` and `<AWS_REGION>` are the account ID and region where you deploy the construct.
 * `<UNIQUEID>` is a 16 characters unique ID calculated based on the CDK path.