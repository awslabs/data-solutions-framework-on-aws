---
sidebar_position: 1
sidebar_label: Quick start
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Quick start

> :heavy_exclamation_mark: If you're new to AWS CDK, we recommend going through a [few basic examples first](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

The DSF on AWS library is available in Typescript or Python, select the right tab for code examples in your preferred language.

In this quickstart we will show you how you can use DSF to deploy EMR Serverless, deploy an S3 configured with AWS best practices, execute a Spark application for word counts and store the result in the created S3 bucket. You can find the full quick start example [here](https://github.com/awslabs/data-solutions-framework-on-aws/tree/main/examples/dsf-quickstart).

The sections below will take you through the steps of creating the CDK application and use it to deploy the infrastructure. 

## Create a CDK app
```bash
mkdir dsf-example && cd dsf-example
```
```mdx-code-block
<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

    ```bash
    cdk init app --language typescript
    ```
  </TabItem>

  <TabItem value="python" label="Python">

    ```bash
    cdk init app --language python
    
    # Once you create the app, active the Python virtual environment:

    source .venv/bin/activate
    ```
  </TabItem>
</Tabs>
```

We can now install DSF on AWS:

```mdx-code-block

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
    ```bash
    npm i @cdklabs/aws-data-solutions-framework --save
    ```
  </TabItem>

  <TabItem value="python" label="Python">

    ```bash
    # Add DSF on AWS to requirements.txt
    
    # requirements.txt:
    ...
    cdklabs.aws_data_solutions_framework
    ...

    # Then you can install CDK app requirements:
    python -m pip install -r requirements.txt
    ```
  </TabItem>
</Tabs>
```

### Create a data lake storage

We will now use [***DataLakeStorage***](constructs/library/02-Storage/03-data-lake-storage.mdx) to create a storage layer for our data lake on AWS.

```mdx-code-block
<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

    In `lib/dsf-example-stack.ts`

    ```typescript
    import * as cdk from 'aws-cdk-lib';
    import * as dsf from '@cdklabs/aws-data-solutions-framework';
    import { Key } from 'aws-cdk-lib/aws-kms';
    import { Policy, PolicyStatement} from 'aws-cdk-lib/aws-iam';
    import { Construct } from 'constructs';

    export class DsfExampleStack extends cdk.Stack {
      constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        const storage = new dsf.storage.AnalyticsBucket(this, 'AnalyticsBucket', {
          encryptionKey: new Key(this, 'DataKey', {
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          }),
        });
      }
    ```
  </TabItem>

  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python
    import cdklabs.aws_data_solutions_framework as dsf
    from aws_cdk.aws_s3 import Bucket
    from aws_cdk import Stack, RemovalPolicy, CfnOutput
    from aws_cdk.aws_iam import Policy, PolicyStatement
    from aws_cdk.aws_kms import Key  

    from constructs import Construct

    class DsfExampleStack(Stack):

     def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        storage = dsf.storage.AnalyticsBucket(
            self, "DataLakeStorage", 
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key= Key(self, "StorageEncryptionKey",
                removal_policy=RemovalPolicy.DESTROY,
                enable_key_rotation=True
            )
        )
    ```
    
  </TabItem>
</Tabs>
```

### Create the EMR Serverless Application and execution role

We will now use [***SparkEmrServerlessRuntime***](constructs/library/Processing/spark-emr-serverless-runtime). In this step we create an EMR Serverless application, create an execution IAM role, to which we will grant read write access to the created S3 bucket.  


```mdx-code-block
<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

  In `lib/dsf-example-stack.ts`
  
  ```typescript

  // Use DSF on AWS to create Spark EMR serverless runtime
  const runtimeServerless = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntimeServerless', {
    name: 'WordCount',
  });

  //  Define policy the execution role to read the data transformation script
  const s3ReadPolicy = new Policy(this, 's3ReadPolicy' , {
    statements: [
        new PolicyStatement({
          actions: ['s3:GetObject', 's3:ListBucket'],
          resources: ['arn:aws:s3:::*.elasticmapreduce/*', 'arn:aws:s3:::*.elasticmapreduce'],
        }),
    ],
  });

  // Use DSF on AWS to create Spark EMR serverless runtime
  const executionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'ProcessingExecRole');
  
  // Provide access for the execution role to read the data transformation script
  executionRole.attachInlinePolicy(s3ReadPolicy);

  // Provide access for the execution role to write data to the created bucket
  storage.grantReadWrite(executionRole);

  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python

    # Use DSF on AWS to create Spark EMR serverless runtime
    spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", name="WordCount",
            removal_policy=RemovalPolicy.DESTROY,
        )

    # Define policy the execution role to read the transformation script from the S3 bucket where its stored 
    s3_read_policy = Policy(self, 'S3ReadPolicy',
          statements=[
              PolicyStatement(
                  actions = ["s3:GetObject", "s3:ListBucket"],
                  resources = ["arn:aws:s3:::*.elasticmapreduce/*", "arn:aws:s3:::*.elasticmapreduce"]
              )
          ]
      )

    # Use DSF on AWS to create Spark EMR serverless runtime
    processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

    # Provide access for the execution role to read the data transformation script
    processing_exec_role.attach_inline_policy(s3_read_policy)

    # Provide access for the execution role to write data to the created bucket
    storage.grant_read_write(processing_exec_role)

    ```
    
  </TabItem>
</Tabs>
```

### Output resource IDs and ARNs

Last we will output the ARNs for the role and EMR serverless app, the ID of the EMR serverless application. These will be passed to the AWS cli when executing `StartJobRun` command.
```mdx-code-block
<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
    In `lib/dsf-example-stack.ts`
    ```typescript
    new cdk.CfnOutput(this, "EMRServerlessApplicationId", { value : runtimeServerless.application.attrApplicationId });
    new cdk.CfnOutput(this, "EMRServerlessApplicationARN", { value : runtimeServerless.application.attrArn });
    new cdk.CfnOutput(this, "EMRServelessExecutionRoleARN", { value : executionRole.roleArn });
    new cdk.CfnOutput(this, "BucketURI", { value : `s3://${storage.bucketName}` });
    
    ```
  </TabItem>

  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python

    CfnOutput(self, "EMRServerlessApplicationId", value=spark_runtime.application.attr_application_id)
    CfnOutput(self, "EMRServerlessApplicationARN", value=spark_runtime.application.attr_arn)
    CfnOutput(self, "EMRServelessExecutionRoleARN", value=processing_exec_role.role_arn)
    CfnOutput(self, "BucketURI", value=f"s3://{storage.bucket_name}")
    ```
  </TabItem>
</Tabs>
```
## Deploy the CDK app

If this is the first time you deploy an AWS CDK app into an environment (account/region), you can install a “bootstrap stack”.

```bash
cdk bootstrap
```

After the bootstrap is completed you can now deploy the stack.

```bash
cdk deploy
```

## Submit a job

```bash
aws emr-serverless start-job-run \
  --application-id EMRServerlessApplicationId \
  --execution-role-arn EMRServelessExecutionRoleARN \
  --job-driver '{
        "sparkSubmit": {
            "entryPoint": "s3://us-east-1.elasticmapreduce/emr-containers/samples/wordcount/scripts/wordcount.py",
            "entryPointArguments": [
          "s3://BucketURI/wordcount_output/"
        ],
            "sparkSubmitParameters": "--conf spark.executor.cores=1 --conf spark.executor.memory=4g --conf spark.driver.cores=1 --conf spark.driver.memory=4g --conf spark.executor.instances=1 --conf spark.hadoop.hive.metastore.client.factory.class=com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory"
        }
    }'
```

Congrats, you created your first CDK app using DSF on AWS! Go ahead and explore all available [constructs](category/constructs) and [examples](category/examples).
