---
sidebar_position: 5
sidebar_label: Spark CICD Pipeline
---

# Spark CICD Pipeline

This construct creates a self-mutable CICD pipeline for a Spark application based on [Amazon EMR](https://aws.amazon.com/fr/emr/) runtime. 

## Overview

The CICD pipeline uses [CDK Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html) and provisions all the resources needed to implement a Spark pipeline, including:
 * A CodeCommit repository to host the code
 * A CodePipeline triggered from the main branch of the CodeCommit repository to process the CICD tasks
 * A CodeBuild stage to build the CDK assets and run the Spark unit tests
 * A Staging stage to deploy the application stack in the staging account and run optional integration tests
 * A Production stage to deploy the application stack in the production account


![Spark CICD Pipeline](../../../static/img/adsf-spark-runtime.png)

## Cross-account deployment

You can use different accounts for dev (where this construct is deployed), staging and production (where the application stack is deployed). 
If using different accounts, bootstrap integration and production accounts with CDK and add a trust relationship from the dev account:
```bash
cdk bootstrap \
  --profile integration \
  --trust <DEV_ACCOUNT> \
  aws://<INTEGRATION_ACCOUNT>/<REGION>
```
More information is available [here](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html#cdk_pipeline_bootstrap)

You need to also provide the accounts information in the cdk.json in the form of:
```json
{
  "staging": {
    "accountId": "<STAGING_ACCOUNT_ID>",
    "region": "<REGION>"
  },
  "prod": {
    "accountId": "<PROD_ACCOUNT_ID>",
    "region": "<REGION>"
  }
}
```

## Passing a CDK Stack for the Spark application

The application stack is expected to be passed via a factory class. To do this, implement the `ApplicationStackFactory` and its `createStack()` method.
The `createStack()` method needs to return a `Stack` instance within the scope passed to the factory method.
This is used to create the application stack within the scope of the CDK Pipeline stage.
The `CICDStage` parameter is passed by the CDK Pipeline via the factory method and allows to customize the behavior of the Stack based on the stage.
For example, staging stage is used for integration tests so there is no reason to create a cron based trigger but the tests would manually trigger the job.

## Unit tests
The construct triggers the unit tests as part of the CICD process using the EMR docker image and a fail fast approach. 
The unit tests are run during the first build step and the entire pipeline stops if the unit tests fail.
Units tests are expected to be run with `pytest` command from the Spark root folder configured via `sparkPath`.
Use a Spark session with a local master and client mode as the unit tests run in a local EMR docker container:
```python
spark = (
        SparkSession.builder.master("local[1]")
        .appName("local-tests")
        .config("spark.submit.deployMode", "client")
        .config("spark.executor.cores", "1")
        .config("spark.executor.instances", "1")
        .config("spark.sql.shuffle.partitions", "1")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .getOrCreate()
    )
```

## Integration tests
You can run integration tests as part of the CICD process using an AWS CLI script that return 0 exit code if success and 1 if failure. 
The integration tests are triggered after the deployment of the application stack in the staging environment. You can configure it via `integTestScript`.

To use resources that are deployed by the Application Stack, pass environment variables to the Construct in the form of key/value pairs via `integTestEnv`:
  * Keys are the names of the environment variables used in the script.
  * Values are CloudFormation output names provided by the application stack (generally resource names or ARN).