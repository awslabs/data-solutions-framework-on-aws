---
sidebar_position: 5
sidebar_label: Spark Serverless Runtime
---

# SparkServerlessRuntime

A construct to create a Spark EMR Serverless Application, along with methods to create IAM roles having the least privilege.

## Overview

The constuct provides a method to create a Spark EMR Serverless Application, with the latest EMR runtime as the default runtime. You can change the runtime by passing your own.

The construct has the following interfaces:

   * The construct takes as props
   * The construct offers method to create execution role for EMR Serverless. The execution role is scoped down to the EMR Serverless Application ARN created by the construct. 
   * A a method that take an IAM role to call the `StartJobRun` and monitor the status of the job.
      * The IAM policies attached to the provided IAM role is as follow:

      ```json
        'emr-serverless:StartApplication',
        'emr-serverless:StopApplication',
        'emr-serverless:StartJobRun',
        'emr-serverless:StopJobRun',
        'emr-serverless:DescribeApplication',
        'emr-serverless:GetJobRun'
      ```
      * The role has a `PassRole` permission scoped as follow:
      ```
      actions: ['iam:PassRole'],
      resources: executionRoleArn,
      conditions: {
        StringLike: {
          'iam:PassedToService': 'emr-serverless.amazonaws.com',
        },
      },
      ``` 

The screenshot a representation of the construct responsibilities. 

![Spark Runtime Serverless](../../../static/img/adsf-spark-runtime.png)

## Example
```python

from aws_cdk import core
from adsf import SparkRuntimeServerless
from aws_cdk.aws_iam import PolicyStatement, Role, PolicyDocument

runtime_serverless = SparkRuntimeServerless(
    stack, 'SparkRuntimeServerless',
    name='spark-serverless-demo'
)

s3_read_policy = PolicyDocument(
    statements=[
        PolicyStatement(
            actions=['s3:GetObject'],
            resources=['S3-BUCKET'],
        )
    ]
)

my_test_role = Role(
    stack, 'TestRole',
    assumed_by=IAM_PRINCIPAL,
)

my_execution_role = runtime_serverless.create_execution_role(
    'execRole1', s3_read_policy
)


runtime_serverless.grant_job_execution(my_test_role, my_execution_role.role_arn)

core.CfnOutput(
    stack, 'SparkRuntimeServerlessStackApplicationArn',
    value=runtime_serverless.application_arn,
)

```