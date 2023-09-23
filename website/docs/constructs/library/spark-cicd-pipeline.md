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


![Spark CICD Pipeline](../../../static/img/adsf-spark-cicd.png)

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

Create your application stack using the factory pattern:

```python
from adsf import ApplicationStackFactory, CICDStage

class EmrApplicationStackFactory(ApplicationStackFactory):

  def create_stack(self, scope: Construct, stage: CICDStage) -> Stack:
    return EmrApplicationStack(scope, 'EmrApplicationStack', stage)

class EmrApplicationStack(Stack):

  def __init__(self, scope: Construct, construct_id: str, stage: CICDStage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
      
    # DEFINE YOUR APPLICATION STACK HERE
```

Use the factory to pass your application stack to the `SparkCICDPipeline` stack:
```python
from cdk.application_stack import EmrApplicationStackFactory
from adsf import SparkCICDPipeline, SparkImage

class CICDPipelineStack(Stack):

  def __init__(self, scope: Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)

    SparkCICDPipeline(self, "SparkCICDPipeline",
      application_name="SparkTest",
      application_stack_factory=EmrApplicationStackFactory()
    )
```
## Unit tests
The construct triggers the unit tests as part of the CICD process using the EMR docker image and a fail fast approach. 
The unit tests are run during the first build step and the entire pipeline stops if the unit tests fail.
Units tests are expected to be run with `pytest` command from the Spark root folder configured via `sparkPath` after a `pip install .` is run.
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
You can optionally run integration tests as part of the CICD process using an AWS CLI bash script that return 0 exit code if success and 1 if failure. 
The integration tests are triggered after the deployment of the application stack in the staging environment. You can configure it via `integTestScript` path that should point to AWS CLI bash script. For example:

```bash
root
|--spark
|    |--integ.sh
|--cdk
```

Integ.sh is a standard bash script using the AWS CLI to validate the application stack:
```bash
#!/bin/bash
EXECUTION_ARN=$(aws stepfunctions start-execution --state-machine-arn $STEP_FUNCTION_ARN | jq -r '.executionArn')
while true
do
    STATUS=$(aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN | jq -r '.status')
    if [ $STATUS = "SUCCEEDED" ]; then
        exit 0 
    elif [ $STATUS = "FAILED" ] || [ $STATUS = "TIMED_OUT" ] || [ $STATUS = "ABORTED" ]; then
        exit 1 
    else 
        sleep 10
        continue
    fi
done
```

To use resources that are deployed by the Application Stack like the Step Functions state machine ARN in the previous example:
1. Create a CfnOutput in your Application Stack with the value of your resource

```python
        # Outputs used by the CDK Pipeline stack to trigger the job
        CfnOutput(self, "StepFunctionArn", value=emr_pipeline.state_machine_arn)
```

2. Pass an environment variables to the Construct in the form of a key/value pair via `integTestEnv`:
  * Key is the name of the environment variable used in the script. In the example, `STEP_FUNCTION_ARN`.
  * Value is the CloudFormation output name from the application stack. In the example, `StepFunctionArn`.
  * Add permissions required to run the integration tests script. In the example, `states:StartExecution` and `states:DescribeExecution`.

```python
  SparkCICDPipeline(self, "SparkCICDPipeline",
    application_name="SparkTest",
    application_stack_factory=EmrApplicationStackFactory(),
    integ_test_script='spark/integ.sh',
    integ_test_env={
      "STEP_FUNCTION_ARN": "StepFunctionArn",
    },
    integ_test_permissions=[
      iam.PolicyStatement(
        actions=[
          "states:StartExecution",
          "states:DescribeExecution"
        ],
        resources=['*']
    )
    ]
  )
```