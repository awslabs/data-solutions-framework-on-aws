---
sidebar_position: 6
sidebar_label: Spark EMR Serverless Job
---

# Spark EMR Serverless job

An [Amazon EMR Serverless](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/getting-started.html) Spark job orchestrated through AWS Step Functions state machine. 

## Overview

The construct creates an AWS Step Functions state machine that is used to submit a Spark job and orchestrate the lifecycle of the job. The construct leverages the [AWS SDK service integrations](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html) to submit the jobs. The state machine can take a cron expression to trigger the job at a given interval. The schema below shows the state machine:


![Spark EMR Serverless Job](../../../static/img/adsf-spark-emr-serverless-job.png)

## Usage

The example stack below shows how to use `EmrServerlessSparkJob` construct. The stack also contains a `SparkEmrServerlessRuntime` to show how to create an EMR Serverless Application and pass it as an argument to the `Spark job` and use it as a runtime for the job. 
```python

from aws_cdk import (
    CfnOutput,
    Stack,
)
from constructs import Construct
from aws_cdk.aws_iam import (
    PolicyDocument,
    PolicyStatement
)
from aws_cdk.aws_stepfunctions import (
    JsonPath
)

from aws_dsf import ( 
    EmrServerlessSparkJob, 
    EmrServerlessSparkJobProps,
    SparkEmrServerlessRuntime
)

class NightlyJobStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)


        emr_app = SparkEmrServerlessRuntime(
            scope=scope, 
            id='emrApp',
            name='mySparkRuntime',
       )
        
        my_s3_read_policy = PolicyDocument(
         statements=[
            PolicyStatement(
                actions=['s3:GetObject'],
                resources=['MY-S3-BUCKET', 'MY-S3-BUCKET/*']
            )
         ]   
        )

        my_execution_role = SparkEmrServerlessRuntime.create_execution_role(scope=scope, id='exec_role', execution_role_policy_document=my_s3_read_policy)
        

        nightly_job_props = EmrServerlessSparkJobProps (
            application_id=emr_app.application_id,
            name='nightly_job',
            execution_role_arn = my_execution_role.role_arn,
            execution_timeout_minutes=30,
            s3_log_uri='s3://emr-job-logs-EXAMPLE/logs',
            spark_submit_entry_point= 'local:///usr/lib/spark/examples/src/main/python/pi.py',
            spark_submit_parameters= '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4'
        )

        nightly_job = EmrServerlessSparkJob (scope=scope, id='nightly_job', props=nightly_job_props)

        CfnOutput(scope=scope, id='job-state-machine', value=nightly_job.state_machine.state_machine_arn )

```