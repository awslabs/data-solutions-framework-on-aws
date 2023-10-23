---
sidebar_position: 6
sidebar_label: Spark EMR Serverless Runtime
---

# Spark EMR Serverless Runtime

A [Spark EMR Serverless Application](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/getting-started.html) with IAM roles and permissions helpers. 

## Overview

The construct creates a Spark EMR Serverless Application, with the latest EMR runtime as the default runtime. You can change the runtime by passing your own as a `Resource property` to construct initializer. It also provides methods to create a principal or grant an existing principal (ie IAM Role or IAM User) with the permission to start a job on this EMR Serverless application.

The construct creates a default VPC that is used by EMR Serverless Application. The VPC has `10.0.0.0/16` CIDR range, and comes with an S3 VPC Endpoint Gateway attached to it. The construct also creates a security group for the EMR Serverless Application. You can override this by defining your own `NetworkConfiguration` as defined in the `Resource properties` of the construct initializer.

The construct has the following interfaces:

   * A construct Initializer that takes an object as `Resource properties` to modify the default properties. The properties are defined in `SparkEmrServerlessRuntimeProps` interface.
   * A method to create an execution role for EMR Serverless. The execution role is scoped down to the EMR Serverless Application ARN created by the construct.
   * A method that takes an IAM role to call the `StartJobRun`, and monitors the status of the job.
      * The IAM policies attached to the provided IAM role is as [follow](https://github.com/awslabs/aws-data-solutions-framework/blob/c965202f48088f5ae51ce0e719cf92adefac94ac/framework/src/processing/spark-runtime/emr-serverless/spark-emr-runtime-serverless.ts#L117).
      * The role has a `PassRole` permission scoped as [follow](https://github.com/awslabs/aws-data-solutions-framework/blob/c965202f48088f5ae51ce0e719cf92adefac94ac/framework/src/processing/spark-runtime/emr-serverless/spark-emr-runtime-serverless.ts#L106).

The construct has the following attributes:

   * applicationArn: EMR Serverless Application ARN
   * applicationId: EMR Serverless Application ID
   * vpc: VPC is created if none is provided
   * emrApplicationSecurityGroup: security group created with VPC
   * s3GatewayVpcEndpoint: S3 Gateway endpoint attached to VPC

The construct is depicted below:

![Spark Runtime Serverless](../../../static/img/adsf-spark-runtime.png)

## Usage

The code snipet below shows a usage exampe of the SparkEmrServerlessRuntime construct.

```python

from aws_cdk import core
from aws_dsf import SparkRuntimeServerless
from aws_cdk.aws_iam import PolicyStatement, Role, PolicyDocument

runtime_serverless = SparkEmrServerlessRuntime(
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

# The IAM role that will trigger the Job start and will monitor it
job_trigger = Role(
    stack, 'EMRServerlessExecutionRole',
    assumed_by=IAM_PRINCIPAL,
)

my_execution_role = runtime_serverless.create_execution_role(
    'execRole1', s3_read_policy
)


runtime_serverless.grant_job_execution(job_trigger, my_execution_role.role_arn)

core.CfnOutput(
    stack, 'SparkRuntimeServerlessStackApplicationArn',
    value=runtime_serverless.application_arn,
)

```
