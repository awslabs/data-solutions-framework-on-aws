---
sidebar_position: 7
sidebar_label: Spark CICD Pipeline
---

# Spark CICD Pipeline

Self-mutable CICD pipeline for a Spark application based on [Amazon EMR](https://aws.amazon.com/fr/emr/) runtime. 

## Overview

The CICD pipeline uses [CDK Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html) and provisions all the resources needed to implement a CICD pipeline for a Spark application on Amazon EMR, including:
 * A CodeCommit repository to host the code
 * A CodePipeline triggered from the main branch of the CodeCommit repository to process the CICD tasks
 * A CodeBuild stage to build the CDK assets and run the Spark unit tests
 * A Staging stage to deploy the application stack in the staging environment and run optional integration tests
 * A Production stage to deploy the application stack in the production environment


![Spark CICD Pipeline](../../../static/img/adsf-spark-cicd.png)

## Cross-account deployment

You can use the same account or optionally use different accounts for CICD (where this construct is deployed), staging and production (where the application stack is deployed). 
If using different accounts, bootstrap staging and production accounts with CDK and add a trust relationship from the CICD account:
```bash
cdk bootstrap --profile staging \
aws://<STAGING_ACCOUNT_ID>/<REGION> \
--trust <CICD_ACCOUNT_ID> \
--cloudformation-execution-policies “POLICY_ARN”
```
More information is available [here](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html#cdk_pipeline_bootstrap)

You need to also provide the accounts information in the cdk.json in the form of:
```json
{
  "staging": {
    "account": "<STAGING_ACCOUNT_ID>",
    "region": "<REGION>"
  },
  "prod": {
    "account": "<PROD_ACCOUNT_ID>",
    "region": "<REGION>"
  }
}
```

## Defining a CDK Stack for the Spark application

The `SparkCICDPipeline` construct deploys an application stack, which contains your business logic, into staging and production environments.
The application stack is a standard CDK stack that you provide. It's expected to be passed via a factory class. 

To do this, implement the `ApplicationStackFactory` and its `createStack()` method.
The `createStack()` method needs to return a `Stack` instance within the scope passed to the factory method.
This is used to create the application stack within the scope of the CDK Pipeline stage.

The `CICDStage` parameter is automatically passed by the CDK Pipeline via the factory method and allows you to customize the behavior of the Stack based on the stage.
For example, staging stage is used for integration tests so testing a processing job should be done via manually triggering it. 
In opposition to production stage where the processing job could be automated on a regular basis.

Create your application stack using the factory pattern:

```python
from aws_cdk import (
  Construct,
  Stack, 
)
from aws_dsf import ApplicationStackFactory, CICDStage


class EmrApplicationStackFactory(ApplicationStackFactory):

  def create_stack(self, scope: Construct, stage: CICDStage) -> Stack:
    return EmrApplicationStack(scope, 'EmrApplicationStack', stage)


class EmrApplicationStack(Stack):

  def __init__(self, scope: Construct, construct_id: str, stage: CICDStage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
      
    # DEFINE YOUR APPLICATION STACK HERE
    # USE STAGE PARAMETER TO CUSTOMIZE THE STACK BEHAVIOR
```

Use the factory to pass your application stack to the `SparkCICDPipeline` construct:
```python
from aws_cdk import (
  Construct,
  Stack, 
)
from application_stack import EmrApplicationStackFactory
from aws_dsf import SparkCICDPipeline, SparkImage


class CICDPipelineStack(Stack):

  def __init__(self, scope: Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)

    SparkCICDPipeline(self, "SparkCICDPipeline",
      spark_application_name="SparkTest",
      application_stack_factory=EmrApplicationStackFactory()
    )
```

## Unit tests
The construct triggers the unit tests as part of the CICD process using the EMR docker image and a fail fast approach. 
The unit tests are run during the first build step and the entire pipeline stops if the unit tests fail.

Units tests are expected to be run with `pytest` command after a `pip install .` is run from the Spark root folder configured via `sparkPath`.

In your Pytest script, use a Spark session with a local master and client mode as the unit tests run in a local EMR docker container:
```python
spark = (
        SparkSession.builder.master("local[1]")
        .appName("local-tests")
        .config("spark.submit.deployMode", "client")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .getOrCreate()
    )
```

## Integration tests
You can optionally run integration tests as part of the CICD process using the AWS CLI in a bash script that return `0` exit code if success and `1` if failure. 
The integration tests are triggered after the deployment of the application stack in the staging environment. You can run them via `integTestScript` path that should point to a bash script using the AWS CLI. For example:

```bash
root
|--spark
|    |--integ.sh
|--cdk
```

`integ.sh` is a standard bash script using the AWS CLI to validate the application stack. In this script example, a Step Function from the application stack is triggered and the result of its execution should be successful:
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
1. Create a `CfnOutput` in your application stack with the value of your resource

```python
class EmrApplicationStack(Stack):

  def __init__(self, scope: Construct, construct_id: str, stage: CICDStage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Outputs used by the CDK Pipeline stack to trigger the job
    CfnOutput(self, "StepFunctionArn", value=emr_pipeline.state_machine_arn)
```

2. Pass an environment variable to the `SparkCICDPipeline` construct in the form of a key/value pair via `integTestEnv`:
  * Key is the name of the environment variable used in the script. In the script example, `STEP_FUNCTION_ARN`.
  * Value is the CloudFormation output name from the application stack. In the application stack example, `StepFunctionArn`.
  * Add permissions required to run the integration tests script. In this example, `states:StartExecution` and `states:DescribeExecution`.

```python
class CICDPipelineStack(Stack):

  def __init__(self, scope: Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)
    
    SparkCICDPipeline(self, "SparkCICDPipeline",
      spark_application_name="SparkTest",
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