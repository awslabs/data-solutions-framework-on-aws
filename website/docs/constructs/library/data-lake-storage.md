---
sidebar_position: 1
sidebar_label: Data lake storage
---

# DataLakeStorage
 
CDK Construct that creates the storage layer of a data lake, composed of 3 `AnalyticsBucket` for Bronze, Silver, and Gold data. 
The respective instances of `AnalyticsBucket` are configured with the best practices and smart defaults for data lake:
- Medalion design with S3 buckets for Bronze, Silver, and Gold data.
- Server-side encryption using a single KMS customer key for all S3 buckets.
- Enforced SSL in-transit encryption.
- Logs data lake access in a dedicated bucket within a prefix matching the bucket name.
- Bronze data is moved to Infrequent Access after 30 days and archived to Glacier after 90 days.
- Silver and Gold data is moved to Infrequent Access after 90 days and is not archived.
- Buckets and objects can be retained when the CDK resource is destroyed (default).
- Buckets and objects can be destroyed when the CDK resource is destroyed, if both removal policy and ADSF global setting (CDK app context) are set.
- All public access blocked.

![Data lake storage](../../../static/img/adsf-data-lake-construct.png)

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
  dataLakeKey: new Key(stack, 'MyDataLakeKey')
});
```

### AnalyticsBucket

`DataLakeStorage` construct is built on top of **AnalyticsBucket**. **AnalyticsBucket** is an Amazon S3 Bucket configured with best practices and defaults for analytics:
- Server side buckets encryption managed by KMS customer key.
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

### AccessLogsBucket

`DataLakeStorage` construct also uses **AccessLogsBucket** for storing S3 access logs. **AccessLogsBucket** is an Amazon S3 Bucket configured with best practices and smart defaults for S3 access logs:
- The default bucket name is `access-logs-<UNIQUE_ID>``
- S3 Managed encryption
- Public access is blocked
- Objects are retained after deletion of the CDK resource
- SSL communication is enforced

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