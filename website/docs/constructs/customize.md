---
sidebar_position: 3
sidebar_label: Customization
---

# Customize AWS DSF constructs

You can customize AWS DSF construts in several ways to adapt to your specific needs:
1. Use the Constructs properties instead of the smart defaults.
2. Extend existing constructs and override specific methods or properties.
3. Access CDK L1 resources and override any property.


## Constructs properties

Use the properties of the construct to adapt the behavior to your needs. With this approach, you bypass the smart defaults provided by the construct. 
Refer to the documentation of each construct to evaluate if your requirements can be implemented. 

:::note
This method should always be prefered because constructs properties are tested as part of the AWS DSF build process.
:::

For example, you can use the `DataLakeStorage` properties to modify the lifecycle configurations for transitioning objects based on your needs instead of using the default rules:

```python
DataLakeStorage(stack, 'MyDataLakeStorage',
    bronze_infrequent_access_delay=90,
    bronze_archive_delay=180,
    silver_infrequent_access_delay=180,
    silver_archive_delay=360,
    gold_infrequent_access_delay=180,
    gold_archive_delay=360)
```

## Construct extension

AWS CDK allows developers to extend classes like any object oriented programing language. You can use this method when you want to:
 * Override a specific method exposed by a construct.
 * Implement your own defaults. Refer to the example of the [`AnalyticsBucket`](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/src/storage/analytics-bucket.ts) that extends the CDK L2 `Bucket` construct to enforce some of the parameters.

## CDK resources override

AWS CDK offers escape hatches to modify constructs that are encapsulated in AWS DSF constructs. The constructs always expose the AWS resources that are encapsulated so you can manually modify their configuration. For achieving this you have 3 options:

 * Modify the L2 construct using its CDK API. For example, you can modify the buckets' policies provided by the [`DataLakeStorage`](https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/data-lake-storage) to provide cross account write access. All the [buckets](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) L2 constructs are exposed as an object parameter:

```python
# Create a data lake using AWS DSF L3 construct
storage = dsf.DataLakeStorage(self, "DataLakeStorage")

# Access the CDK L2 Bucket construct exposed by the L3 construct
gold_bucket = storage.gold_bucket

# Use the Bucket CDK API to modify the Bucket Policy and add cross account write access
gold_bucket.add_to_resource_policy(iam.PolicyStatement(
    actions=[
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucketMultipartUploads',
        's3:ListMultipartUploadParts',
        's3:AbortMultipartUpload',
        's3:ListBucket',
    ],
    effect=iam.Effect.ALLOW,
    principals=[iam.AccountPrincipal('111111111111')],
))
```

 * [Modify the L1 construct resource](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_resource) when there is a CDK property available on the L1 construct. 
  For example, you can override CDK L1 property for setting the S3 transfer Acceleration on the gold bucket of the `DataLakeStorage`:

```python
# Create a data lake using AWS DSF L3 construct
storage = dsf.DataLakeStorage(self, "DataLakeStorage")

# Access the CDK L1 Bucket construct exposed by the L3 construct
cfn_bucket = storage.gold_bucket.node.default_child

# Override the CDK L1 property for transfer acceleration
cfn_bucket.accelerate_configuration = s3.CfnBucket.AccelerateConfigurationProperty(
    acceleration_status = 'Enabled'
)
```

 * [Override the CloudFormation properties](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_raw) when there isn't any CDK property and you need to modify the CFN template directly. 
  For example, you can override CloudFormation property for setting the S3 transfer Acceleration on the gold bucket of the `DataLakeStorage`:

```python
# Create a data lake using AWS DSF L3 construct
storage = dsf.DataLakeStorage(self, "DataLakeStorage")

# Access the CDK L1 Bucket construct exposed by the L3 construct
cfn_bucket = storage.gold_bucket.node.default_child

# Override the CloudFormation property for transfer acceleration
cfn_bucket.add_override('Properties.AccelerateConfiguration.AccelerationStatus', 'Enabled')
```