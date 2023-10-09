---
sidebar_position: 3
sidebar_label: Access logs bucket
---

# AccessLogsBucket

Amazon S3 Bucket configured for S3 access logs storage.

## Overview

`AccessLogsBucket` construct is an Amazon S3 Bucket configured with best practices and smart defaults for storing S3 access logs:
- The default bucket name is in the form of `accesslogs-<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>`
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

AccessLogsBucket(stack, 'MyAccessLogs',
                 removal_policy=RemovalPolicy.DESTROY)
```

## Bucket Naming

The construct ensures the default bucket name uniqueness which is a [pre-requisite](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html) to create Amazon S3 buckets. 
To achieve this, the construct is creating the default bucket name like `accesslogs-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>` where:
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
  RemovalPolicy, 
)
from aws_dsf import AccessLogsBucket, BucketUtils
from aws_cdk.aws_kms import Key

app = App()
stack = Stack(app, 'AccessLogsBucketStack')

AccessLogsBucket(stack, 'MyAccessLogs',
                 bucket_name=BucketUtils.generate_unique_bucket_name(stack, 'MyAccessLogs', 'my-custom-name'),
                 removal_policy=RemovalPolicy.DESTROY)
```