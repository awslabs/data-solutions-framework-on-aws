---
sidebar_position: 7
sidebar_label: Spark Job
---

# PySpark Application Package


## Overview




## Usage

### Package a PySpark application and submit a job

The stack defined below shows a usage example of the `EmrOnEksSparkJob` construct. The path where the PySpark is a defined as follow:

```bash
root
|--spark
|    |--test
|    |--src
|       |--entrypoint.py
|    |--requirement.txt
|    |--Dockerfile #contains the build instructions to package the virtual environment for PySpark
|--cdk
```

```Dockerfile
FROM --platform=linux/amd64 public.ecr.aws/amazonlinux/amazonlinux:2 AS base

RUN yum install -y python3 

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /app

COPY . .

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install venv-pack==0.2.0 && \
    python3 -m pip install .

RUN mkdir /output && venv-pack -o /output/pyspark-env.tar.gz && chmod ugo+r /output/pyspark-env.tar.gz
```


```python


from aws_cdk import Stack, RemovalPolicy, Names
from aws_cdk.aws_iam import *
from aws_cdk.aws_lambda import *
from aws_cdk.aws_events import *
from aws_cdk.custom_resources import *
from aws_cdk.aws_s3_deployment import *
from constructs import Construct
from aws_dsf import (
  ApplicationStackFactory,
  CICDStage,
  DataLakeStorage,
  SparkEmrServerlessRuntime,
  SparkEmrServerlessJob, 
  SparkEmrServerlessJobProps,
  PySparkApplicationPackage
)

spark_runtime = SparkEmrServerlessRuntime(self, "SparkProcessingRuntime", name="TaxiAggregation")


    pyspark_app = PySparkApplicationPackage(
      self,
      "PySparkApplicationPackage",
      entrypoint_path="./../spark/src/agg_trip_distance.py",
      pyspark_application_name="taxi-trip-aggregation",
      removal_policy=RemovalPolicy.DESTROY
    )

    spark_job_params = SparkEmrServerlessJobProps(
      name="JOB-NAME",
      application_id=spark_runtime.application_id,
      execution_role_arn=processing_exec_role.role_arn,
      spark_submit_entry_point=pyspark_app.entrypoint_s3_uri
    )

    spark_job = SparkEmrServerlessJob(
      self, 
      "SparkProcessingJob",
      spark_job_params
    )

```