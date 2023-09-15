---
sidebar_position: 2
sidebar_label: Analytics bucket
---

# AnalyticsBucket

***AnalyticsBucket*** is an Amazon S3 Bucket configured with best-practices and defaults for analytics:
- Server side buckets encryption managed by KMS customer key.
  - You need to provide a KMS Key.
- SSL communication enforcement.
- Access logged to an S3 bucket within a prefix matching the bucket name.
- All public access blocked.
- Two-step protection for bucket and objects deletion.

For custom requirements that are not covered, use AWS CDK [*Bucket*](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) directly.

#### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import { AnalyticsBucket} from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'AnalyticsBucketStack');

// Set context value for global data removal policy (or set in cdk.json).
stack.node.setContext('adsf', {'remove_data_on_destroy': 'true'})

const encryptionKey = new Key(stack, 'DataKey', {
  removalPolicy: RemovalPolicy.DESTROY,
  enableKeyRotation: true,
});

new AnalyticsBucket(stack, 'MyAnalyticsBucket', {
  encryptionKey,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```