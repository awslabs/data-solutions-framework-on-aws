---
sidebar_position: 3
sidebar_label: Access logs bucket
---

# AccessLogsBucket

We provide ***AccessLogsBucket*** construct for storing S3 access logs. **AccessLogsBucket** is an Amazon S3 Bucket configured with best-practices and smart defaults for S3 access logs:
- The default bucket name is `access-logs-<UNIQUE_ID>`.
- S3 Managed encryption.
- Public access is blocked.
- Objects are retained after deletion of the CDK resource.
- SSL communication is enforced.


#### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import { AccessLogsBucket } from 'aws-data-solutions-framework';

const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
  encryption: BucketEncryption.KMS_MANAGED,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
}
```