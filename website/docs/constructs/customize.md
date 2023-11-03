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

## CDK L1 resources override

AWS CDK offers escape hatches to modify L1 constructs that are encapsulated in AWS DSF constructs. The constructs always expose the AWS resources that are encapsulated so you can manually modify their configuration. For achieving this you have 2 options:

 * [Modify the L1 construct resource](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_resource) when there is a CDK property available on the L1 construct.

 * [Override the CloudFormation properties](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_raw) when there isn't any CDK property and you need to modify the CFN template directly.