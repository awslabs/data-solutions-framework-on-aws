[//]: # (storage.access-logs-bucket)
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

[example smart default](./examples/access-logs-bucket-default.lit.ts)

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

[example bucket naming](./examples/access-logs-bucket-naming.lit.ts)

[//]: # (storage.analytics-bucket)
# AnalyticsBucket

Amazon S3 Bucket configured for analytics.

## Overview

`AnalyticsBucket` is an Amazon S3 Bucket configured with the following best-practices and defaults for analytics:
- The bucket name is in the form of `<BUCKET_NAME>-<CDK_ID>-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUEID>`
- Server side bucket encryption managed by KMS customer key. You need to provide a [KMS Key](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- SSL communication enforcement.
- Access logged to an S3 bucket within a prefix matching the bucket name. By default, store logs in itself.
- All public access blocked.
- Two-step protection for bucket and objects deletion.

`AnalyticsBucket` extends the Amazon [S3 `Bucket`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) CDK Construct. For custom requirements that are not covered, use the [`Bucket`](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_s3/Bucket.html#bucket) construct directly.


## Usage

[example smart default](./examples/analytics-bucket-default.lit.ts)

## Objects removal

You can specify if the bucket and objects should be deleted when the CDK resource is destroyed using `removalPolicy`. Refer to the [DataLakeStorage documentation](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Storage/data-lake-storage#objects-removal)

:::warning
If no access logs bucket is configure, the `AnalyticsBucket` stores its access logs in itself. 
This prevents from properly deleting the resources when the `removalPolicy` is set to `DESTROY` because it creates an edge case where the deletion of the S3 Objects recreates Objects corresponding the access logs. The S3 Bucket is then never empty and the deletion of the Bucket fails.
:::

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

[example bucket naming](./examples/analytics-bucket-naming.lit.ts)

[//]: # (storage.data-lake-storage)
# DataLakeStorage

Data Lake based on medallion architecture and AWS best-practices.

## Overview

At the high level, `DataLakeStorage` creates three [Amazon S3](https://aws.amazon.com/s3) buckets configured specifically for data lake on AWS. By default these buckets are named *Bronze*, *Silver*, and *Gold* to represent [different data layers](https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/data-layer-definitions.html). You can customize bucket names according to your needs.
`DataLakeStorage` uses [`AnalyticsBucket`](analytics-bucket) and [`AccessLogsBucket`](access-logs-bucket) constructs from DSF on AWS, to create storage and access logs buckets respectively. Your data lake storage is encrypted using [AWS KMS](https://aws.amazon.com/kms/) a default customer managed key. You can also provide your own KMS Key. We provide data lifecycle management that you can customize to your needs.

Here is the overview of `DataLakeStorage` features:
- Medalion design with S3 buckets for Bronze, Silver, and Gold data.
- Server-side encryption using a single KMS customer key for all S3 buckets.
- Enforced SSL in-transit encryption.
- Logs data lake access in a dedicated bucket within a prefix matching the bucket name.
- Buckets, objects and encryption keys can be retained when the CDK resource is destroyed (default).
- All public access blocked.

![Data lake storage](../../../website/static/img/adsf-data-lake-storage.png)

## Usage

[example smart default](examples/data-lake-storage-default.lit.ts)

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

[example bucket naming](./examples/data-lake-storage-naming.lit.ts)

## Objects removal

You can specify if buckets, objects and encryption keys should be deleted when the CDK resource is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications.

Buckets, objects and encryption keys can be destroyed when the CDK resource is destroyed only if **both** data lake removal policy and DSF on AWS global removal policy are set to remove objects.

You can set `@data-solutions-framework-on-aws/removeDataOnDestroy` (`true` or `false`) global data removal policy in `cdk.json`:

```json title="cdk.json"
{
  "context": {
    "@data-solutions-framework-on-aws/removeDataOnDestroy": true
  }
}
```

Or programmatically in your CDK app:

[example object removal](./examples/data-lake-storage-objects-removal.lit.ts)


## Data lifecycle management
We provide a simple [data lifecycle management](https://aws.amazon.com/s3/storage-classes/) for data lake storage, that you can customize to your needs. By default:
- Bronze data is moved to Infrequent Access after 30 days and archived to Glacier after 90 days.
- Silver and Gold data is moved to Infrequent Access after 90 days and is not archived.

Change the data lifecycle rules using the DataLakeStorage properties:

[example buckets lifecycle](./examples/data-lake-storage-lifecycle.lit.ts)

[//]: # (storage.opensearch)
# Opensearch

Amazon Opensearch construct supporting SAML integration using IAM Identity Center. 

## Overview

The construct follows best practises for Amazon Opensearch deployment, provisioning opensearch domain in VPC and using SAML-authentication plugin to access Opensearch Dashboards. 
By default VPC also creates VPN client endpoint with SAML-authentication to allow secure access to the dashboards. Optionally, you can also provide your own VPC or choose to deploy internet-facing Opensearch domain by setting `deployInVpc=false` in construct parameters.

SAML-authentication can work with any SAML2.0-compatible provider like Okta. If you use AWS IAM Identity center please check the section below for details. The construct require at least admin role to be provided as parameters. 

For mapping additional IdP roles to opensearch dashboard roles, you can use `addRoleMapping` method. 

## Confgiure IAM Identity center

You need to have IAM Identity center enabled in the same region you plan to deploy your solution. 
To configure SAML integration with opensearch you will need to create a custom SAML 2.0 Application and have at least one user group created and attached to the application.
Please follow the [step-by-step guidance](https://aws.amazon.com/blogs/big-data/role-based-access-control-in-amazon-opensearch-service-via-saml-integration-with-aws-iam-identity-center/) to set up IAM Identity center SAML application.

## Usage

[example default](examples/opensearch-saml.lit.ts)