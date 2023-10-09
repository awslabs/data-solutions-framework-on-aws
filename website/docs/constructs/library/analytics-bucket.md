---
sidebar_position: 2
sidebar_label: Analytics bucket
---

# AnalyticsBucket

Amazon S3 Bucket configured for analytics.

## Overview

`AnalyticsBucket` is an Amazon S3 Bucket configured with the following best-practices and defaults for analytics:
- The bucket name is in the form of `<BUCKET_NAME>-<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>`
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
stack = Stack(app, 'AnalyticsBucketStack')


encryption_key = Key(stack, 'DataKey',
                     removal_policy=RemovalPolicy.DESTROY,
                     enable_key_rotation=True)

AnalyticsBucket(stack, 'MyAnalyticsBucket',
                bucket_name=BucketUtils.generate_unique_bucket_name(stack, 'MyAnalyticsBucket', 'my-custom-name')
                encryption_key=encryption_key)
```