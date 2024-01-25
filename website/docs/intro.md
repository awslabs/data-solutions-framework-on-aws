---
sidebar_position: 1
sidebar_label: Quick start
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Quick start

> :heavy_exclamation_mark: If you're new to AWS CDK, we recommend going through a [few basic examples first](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

The DSF on AWS library is available in Typescript or Python, select the right tab for code examples in your preferred language.

In this quick start we will show you how you can use DSF to deploy EMR Serverless, create a data lake with three stages (bronze, silver, gold), copy data to bronze, and process it to store it in the silver bucket. You can find the full quick start example [here](https://github.com/awslabs/data-solutions-framework-on-aws/tree/main/examples/dsf-quickstart). The sections below will take you through the steps of creating the CDK application and use it to deploy the infrastructure. 

### Create a CDK app
```bash
mkdir dsf-example && cd dsf-example
```

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  

  ```bash
  cdk init app --language typescript
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    ```bash
    cdk init app --language python
    
    # Once you create the app, active the Python virtual environment:

    source .venv/bin/activate
    ```
    
  </TabItem>
</Tabs>

We can now install DSF on AWS:

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  

  ```bash
  npm i aws-dsf --save
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    ```bash
    # Add DSF on AWS to requirements.txt
    
    # requirements.txt:
    ...
    aws_dsf==1.0.0rc6
    ...

    # Then you can install CDK app requirements:
    python -m pip install -r requirements.txt
    ```
    
  </TabItem>
</Tabs>

### Use DSF on AWS to create a data lake storage

We will now use [***DataLakeStorage***](constructs/library/02-Storage/03-data-lake-storage.mdx) to create a storage layer for our data lake on AWS. When we deploy this simple AWS CDK application we will have the following resources created:

![Data lake storage](../static/img/adsf-data-lake-storage.png)

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
  In `lib/dsf-example-stack.ts`
  ```typescript
  import * as cdk from 'aws-cdk-lib';
  import { DataLakeStorage } from 'aws-dsf';

  export class DsfExampleStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

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
    }
  }

  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python
    import aws_cdk as cdk
    import aws_dsf as dsf

    from constructs import Construct


    class DsfExampleStack(cdk.Stack):

      def __init__(self, scope: cdk.App, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        data_lake_storage = dsf.DataLakeStorage(
          self,
          bronze_name="my-bronze",
          bronze_infrequent_access_delay="90",
          bronze_archive_delay="180",
          silver_name="my-silver",
          silver_infrequent_access_delay="180",
          silver_archive_delay="360",
          gold_name="my-gold",
          gold_infrequent_access_delay="180",
          gold_archive_delay="360",
          removal_policy=cdk.RemovalPolicy.RETAIN,
        )
    ```
    
  </TabItem>
</Tabs>


### Use DSF on AWS to copy the data


<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
  In `lib/dsf-example-stack.ts`
  ```typescript

      const sourceBucket = Bucket.fromBucketName(this, 'sourceBucket', 'nyc-tlc');

      new dsf.utils.S3DataCopy(this, 'S3DataCopy', {
        sourceBucket,
        sourceBucketPrefix: 'trip data/',
        sourceBucketRegion: 'us-east-1',
        targetBucket,
        targetBucketPrefix: 'staging-data/',
      });

  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python

    source_bucket = Bucket.from_bucket_name(self, "sourceBucket", "nyc-tlc")

      dsf.utils.S3DataCopy(
        self,
        "CopyData",
        source_bucket=source_bucket,
        source_bucket_prefix="trip data/",
        source_bucket_region="us-east-1",
        target_bucket=storage.bronze_bucket,
        target_bucket_prefix="nyc-taxi-data/",
        removal_policy=RemovalPolicy.DESTROY,
      )
    ```
    
  </TabItem>
</Tabs>

### Use DSF on AWS to create the EMR Serverless Application



<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
  In `lib/dsf-example-stack.ts`
  ```typescript

  const runtimeServerless = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntimeServerless', {
          name: 'spark-serverless-demo',
      });


  const executionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'EmrServerlessExecutionRole', s3ReadPolicyDocument);
  
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    In `dsf_example/dsf_example_stack.py`
    ```python

    # Use DSF on AWS to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
    spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )

    processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

    storage.bronze_bucket.grant_read_write(processing_exec_role)
    source_bucket.grant_read(processing_exec_role)

    ```
    
  </TabItem>
</Tabs>

Now you can deploy your stack!
```bash
cdk deploy
```

Submit the processing job
```bash
aws emr-serverless start-job-run \
    --application-id application-id \
    --execution-role-arn job-role-arn \
    --name job-run-name \
    --job-driver '{
        "sparkSubmit": {
          "entryPoint": "s3://DOC-EXAMPLE-BUCKET/scripts/wordcount.py",
          "entryPointArguments": ["s3://DOC-EXAMPLE-BUCKET/emr-serverless-spark/output"],
          "sparkSubmitParameters": "--conf spark.executor.cores=1 --conf spark.executor.memory=4g --conf spark.driver.cores=1 --conf spark.driver.memory=4g --conf spark.executor.instances=1"
        }
    }'
```

Congrats, you created your first CDK app using DSF on AWS! Go ahead and explore all available [constructs](category/constructs) and [examples](category/examples).

