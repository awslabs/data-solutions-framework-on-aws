---
sidebar_position: 3
sidebar_label: Access logs bucket
---

# AccessLogsBucket

Amazon S3 Bucket configured for S3 access logs storage.

## Overview

`AccessLogsBucket` construct is an Amazon S3 Bucket configured with best practices and smart defaults for storing S3 access logs:
- The default bucket name is `access-logs-<UNIQUE_ID>`.
- The bucket encryption is S3 Managed.
- Public access is blocked.
- Two-step protection for bucket and objects deletion.
- SSL communication is enforced.

`AccessLogsBucket` extends the Amazon [S3 `Bucket`](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_s3/Bucket.html#bucket) CDK Construct. For custom requirements that are not covered, use the `Bucket` construct directly.

#### Usage

```python
from aws_cdk import (
  App, 
  Stack, 
  RemovalPolicy, 
)
from aws_data_solutions_framework import AccessLogsBucket
from aws_cdk.aws_kms import Key

app = App()
stack = Stack(app, 'AccessLogsBucketStack')

AccessLogsBucket(self, 'AccessLogsBucket',
                         removal_policy=RemovalPolicy.DESTROY)
```