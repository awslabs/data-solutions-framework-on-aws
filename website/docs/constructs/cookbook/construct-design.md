---
sidebar_position: 1
sidebar_label: Constructs design
---

# Building new constructs

AWS DSF Constructs follow the best practices detailed below. We recommend you follow them for building any new construct.

## Construct design

Refer to these best practices when designing a new construct:

* Use AWS CDK L2 Constructs instead of L1 when available. Alpha constructs should not be used because there may be some breaking changes in the API.

* Resources naming should be optional and CDK should generate them when not provided. CDK ensures names uniqueness. If the name of the resource is provided as part of the constructor props, the name should be unique at least in the stack, sometimes in the AWS account or globally (like S3 bucket names) depending on the type of the resource.

* Delete retention policy should be `RETAIN` by default but the possibility to `DESTROY` resources when destroying the CDK stack should be provided in the construct Props. This DESTROY parameter should only be considered (resources to be deleted) if the global guardrail is configured accordingly (global CDK parameter to be defined). The overall guard rail approach is explained in the [`DataLakeStorage`](../library/02-Storage/03-data-lake-storage.mdx#objects-removal) and code example is available [here](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/src/storage/lib/data-lake-storage.ts#L150).
  
* Extend `Construct` vs L2 Resource: 
    * If the construct you want to create contains only one resource and it’s a specific implementation/configuration, then you should go with extending the base resource. An example is the [`AnalyticsBucket`](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/src/storage/lib/analytics-bucket.ts#L33).
    * If the resource contains more than one resource, it should extend `Construct`. It allows to properly scope resources created within the construct (using `this` parameter as the scope) and avoid collisions in resource naming.


* Expose all the resources created by your construct so you provide a way for end-users to [customize](../customize.mdx) them. Sometimes, it's more user friendly to expose a resource directly to avoid long resources chaining. For example, in the `DataLakeStorage` construct that contains a KMS `Key` attached to the `AnalyticsBucket` part of the `DataLakeStorage`, we re-expose the key so you can access it directly via `dataLakeStorage.key` instead of `dataLakeStorage.bronze.key`.

* If a Construct is creating a role, provide a props to get the role as a parameter. Some AWS customers create roles within a specific process outside of any infrastructure as code. A code example is available 

* Bucket encryption: if no business data is store in the bucket, you can use KMS_MANAGED which uses a default KMS key for the account. If the bucket will contain business data, use KMS and create a key.

* Use AWS CDK interfaces (whenever it exists) as input/output of your construct instead of the AWS CDK resource. For example, use `IBucket` instead of `Bucket` as the property or public member of your construct. 

* Avoid using generic `string` parameters for passing values that are attributes of an AWS resource. Because there is no check during synthetize time, it's very error prone. Prefer passing the entire object (or interface). For examples:
  * Do not use an IAM Role ARN as a `string` property for your construct. Instead, use an `IRole` type in the properties and get the ARN from the attributes.
  * Do not use S3 URI in the form of `s3://MYBUCKET/MYPREFIX`. Instead, use an `IBucket` type and a prefix in `string` type.

* Extend the `TrackedConstruct` instead of the base CDK `Construct` to measure the number of deployments. See the [dedicated documentation](./tracked-construct.md). 

* Tag all resources that are created by the construct and support tagging. 
Extending the [`TrackedConstruct`](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/src/utils/lib/tracked-construct.ts) will automatically add a tag to all AWS resources that are created by CDK. 
Some constructs will create resources outside of CDK like the [`SparkEmrServerlessJob`](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/src/processing/lib/spark-job/spark-job-emr-serverless.ts) that triggers EMR Serverless jobs from a Step Function. 
For this kind of situation, use the resource parameters to tag it with `DSF_OWNED_TAG: true` like in this [example](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/src/processing/lib/spark-job/spark-job-emr-serverless.ts#L78).

## Coding style

Follow this coding style when submitting code to AWS DSF constructs:

* Use 2 spaces indentation and 120 characters wide
* ATX style headings in markdown (e.g. ## H2 heading)
* Import libraries directly 
    * Use `import { Construct } from '@aws-cdk/core'`
    * Instead of `import '@aws-cdk/core' as cdk`
        
* Do not use Typescript code that is falling into these JSII limitations because JSII won’t be able to translate Typescript code in other languages. See [documentation](https://aws.github.io/jsii/user-guides/lib-author/typescript-restrictions/)
* Do not use your own `Interface` in the construct properties because they are translated in Python `Protocols` by JSII and then cannot be referenced when consuming the construct.
* Set the defaults values for props at the beginning of the construct constructor (first lines of code) so it's easy to find and maintain.
* Write the props interface for a Construct class in a dedicated file.
* Resources IDs use Pascal Case. For example `BronzeAnalyticsBucket`.
* Resource IDs should contain the name of construct they use. For example the ID `BronzeAnalyticsBucket` in the `DataLakeStorage` construct contains `AnalyticsBucket` so we can easily identify which resource it is.
* Resources IDs should not repeat the name of the construct they are part of. For example in `DataLakeStorage` construct, the ID of the bronze bucket is `BronzeBucket` not `DataLakeStorageBronzeBucket`.
* Do not use any property value in construct IDs because it can be a reference to another resource only resolved at deploy time.


## Unit testing

Implement unit tests by validating CloudFormation templates that are generated by CDK. 
CDK provides helpers for this approach with [fine-grained assertions](https://docs.aws.amazon.com/cdk/v2/guide/testing.html#testing_fine_grained). 

* Implement one test suite for default configuration and one test suite for custom configuration. A test suite is a group of `test` clauses within a `describe` block.
* Test one feature per `test` clause so we can easily identify what is failing. You can find an example [here](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/test/unit/processing/pyspark-application-package.test.ts)
* Every change requires a unit test.

## Integration test

We run integration tests (also call end-to-end tests) in our AWS internal account on a regular basis or manually when a Pull Request is approved. 
Integration tests are provisioning constructs, then checking output values from the CDK deployment, and finally destroying the stack.

Be sure to follow these recommendations when implementing end-to-end tests:
* Create a stack using the [`TestStack`](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/test/e2e/test-stack.ts) construct.
* Configure the deployment timeout according to the construct (see the [`DataLakeStorage`](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/test/e2e/data-lake-storage.e2e.test.ts#L14) example).
* Test the deployment of 2 resources in the same account to validate uniqueness of names. 
* Set the [global](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/test/e2e/data-lake-storage.e2e.test.ts#L21) AND the [construct](https://github.com/awslabs/aws-data-solutions-framework/blob/main/framework/test/e2e/data-lake-storage.e2e.test.ts#L34) removal policies to DESTROY, then check in the CloudFormation console if there is no resource skipped when the stack is deleted.

## Documentation

See the [compiled documentation](./compiled-documentation.md) guide.


