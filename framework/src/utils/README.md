[//]: # (utils.data-vpc)
# DataVpc

Amazon VPC optimized for data platforms.

## Overview

`DataVpc` construct provides a standard Amazon VPC with best practices for secuity and data platforms implementations:
- The VPC is created with public and private subnets across 3 availability zones (1 of each per AZ) and 3 NAT gateways.
- VPC CIDR mask should be larger than 28. The CIDR is split between public and private subnets with private subnets being twice as large as public subnet. 
- The flow logs maaged by a dedicated least-privilege IAM Role. The role can be customized.
- The flow logs exported to an Amazon CloudWatch LogGroup encrypted with an Amazon KMS customer managed key. The KMS key can be customized.
- A gateway VPC endpoint is created for S3 access.

## Usage

[example default](./examples/data-vpc-default.lit.ts)


## VPC Flow Logs

The construct logs VPC Flow logs in a Cloudwatch Log Group that is encrypted with a customer managed KMS Key. Exporting VPC Flow Logs to CloudWatch requires an IAM Role. 
You can customize the VPC Flow Logs management with:
- your own KMS Key. Be sure to attach the right permissions to your key. 
Refer to the [AWS documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html) for full description.
- your own IAM Role. Be sure to configure the proper trust policy and permissions. Refer to the [AWS documentation](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-cwl.html#flow-logs-iam-role) for full description.
- a custom log retention policy. Default is one week.

[example custom KMS Key and IAM Role](./examples/data-vpc-flowlog.lit.ts)

## Removal policy

You can specify if the Cloudwatch Log Group and the KMS encryption Key should be deleted when the CDK resource is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications.

Log group and encryption key can be destroyed when the CDK resource is destroyed only if **both** data vpc removal policy and DSF on AWS global removal policy are set to remove objects.

You can set `@data-solutions-framework-on-aws/removeDataOnDestroy` (`true` or `false`) global data removal policy in `cdk.json`:

```json title="cdk.json"
{
  "context": {
    "@data-solutions-framework-on-aws/removeDataOnDestroy": true
  }
}
```

Or programmatically in your CDK app:

[example object removal](./examples/data-vpc-removal.lit.ts)

[//]: # (utils.customization)
# Customize DSF on AWS constructs

You can customize DSF on AWS constructs in several ways to adapt to your specific needs:
1. Use the Constructs properties instead of the smart defaults.
2. Extend existing constructs and override specific methods or properties.
3. Access CDK L1 resources and override any property.


## Constructs properties

Use the properties of the construct to adapt the behavior to your needs. With this approach, you bypass the smart defaults provided by the construct.
Refer to the documentation of each construct to evaluate if your requirements can be implemented.

:::note
This method should always be preferred because constructs properties are tested as part of the DSF on AWS build process.
:::

For example, you can use the `DataLakeStorage` properties to modify the lifecycle configurations for transitioning objects based on your needs instead of using the default rules:

[example construct parameters](../storage/examples/data-lake-storage-lifecycle.lit.ts)

## Construct extension

AWS CDK allows developers to extend classes like any object-oriented programing language. You can use this method when you want to:
* Override a specific method exposed by a construct.
* Implement your own defaults. Refer to the example of the [`AnalyticsBucket`](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/src/storage/analytics-bucket.ts) that extends the CDK L2 `Bucket` construct to enforce some of the parameters.

## CDK resources override

AWS CDK offers escape hatches to modify constructs that are encapsulated in DSF on AWS constructs. The constructs always expose the AWS resources that are encapsulated so you can manually modify their configuration. For achieving this you have 3 options:

* Modify the L2 construct using its CDK API. For example, you can modify the buckets' policies provided by the [`DataLakeStorage`](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-lake-storage) to provide cross account write access. All the [buckets](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) L2 constructs are exposed as an object parameter:

[example customization l2](./examples/customization-l2.lit.ts)

* [Modify the L1 construct resource](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_resource) when there is a CDK property available on the L1 construct.
  For example, you can override CDK L1 property for setting the S3 transfer Acceleration on the gold bucket of the `DataLakeStorage`:

[example customization l1](./examples/customization-l1.lit.ts)

* [Override the CloudFormation properties](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_raw) when there isn't any CDK property, and you need to modify the CFN template directly.
  For example, you can override CloudFormation property for setting the S3 transfer Acceleration on the gold bucket of the `DataLakeStorage`:

[example customization cfn](./examples/customization-cfn.lit.ts)