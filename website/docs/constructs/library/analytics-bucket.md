---
sidebar_position: 2
sidebar_label: Analytics bucket
---

# AnalyticsBucket

Amazon S3 Bucket configured for analytics.

## Overview

`AnalyticsBucket` is an Amazon S3 Bucket configured with the following best-practices and defaults for analytics:
- The bucket name is suffixed with a unique ID like `<MY_BUCKET_NAME>-<UNIQUE_ID>`
- Server side bucket encryption managed by KMS customer key. You need to provide a [KMS Key](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- SSL communication enforcement.
- Access logged to an S3 bucket within a prefix matching the bucket name (via the [`AccessLogsBucket`](access-logs-bucket)).
- All public access blocked.
- Two-step protection for bucket and objects deletion.

`AnalyticsBucket` extends the Amazon [S3 `Bucket`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) CDK Construct. For custom requirements that are not covered, use the [`Bucket`](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_s3/Bucket.html#bucket) construct directly.

## Usage

```python
from aws_cdk import (
  App, 
  Stack, 
  RemovalPolicy, 
)
from aws_dsf import AnalyticsBucket
from aws_cdk.aws_kms import Key

app = App()
stack = Stack(app, 'AnalyticsBucketStack')

encryption_key = Key(stack, 'DataKey',
                     removal_policy=RemovalPolicy.DESTROY,
                     enable_key_rotation=True)

AnalyticsBucket(stack, 'MyAnalyticsBucket',
                encryption_key=encryption_key
                )
```

## Objects removal

You can specify if the bucket and objects should be deleted when the CDK resource is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications. 

The bucket and objects can be destroyed when the CDK resource is destroyed only if **both** the removal policy parameter of the construct and AWS DSF global removal policy are set to remove objects.

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

You will also need to set removal policy for `AnalyticsBucket` when using the construct:
```python
AnalyticsBucket(stack, 'AnalyticsBucket',
  # ...
  removal_policy=RemovalPolicy.DESTROY,
  # ...
)
```
