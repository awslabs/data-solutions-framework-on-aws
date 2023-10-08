---
sidebar_position: 7
sidebar_label: PySpark Application Package
---

# PySpark Application Package

A construct to package your PySpark application (the entrypoint, supporting files and virtual environment) and upload it to an Amazon S3 bucket. In the rest of the documentation we call the entrypoint, supporting files and virtual environment as artifacts.

## Overview

The PySpark Application Package has two responsibilities:

* Upload your PySpark entrypoint application to an artifact bucket
* Package your PySpark virtual environment (venv) and upload it to an artifact bucket. The package of venv is done using docker, an example in the [Usage](#usage) section shows how to write the Dockerfile to package the application.

The constructs uses the [Asset](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets.Asset.html) to upload the PySpark Appliaction artifacts to CDK Asset bucket. These are then copied to an S3 bucket we call artifact bucket. 

### Resources created
* An Amazon S3 Bucket to store the PySpark Appliaction artifacts. You can also provide your own if you have already a bucket that you want to use. 
* An IAM role used by a Lambda to copy from the CDK Asset bucket to the artifcat bucket created above or provided.

The schema below shows the resources created and the responbilies of the consturct:

![PySpark Application Package](../../../static/img/adsf-pyspark-application-package.png)

## Usage

In this example we will show you how you can use the construct to package a PySpark application 
and submit a job to EMR Serverless leveraging ADSF `Spark EMR Serverless Runtime` and `Spark Job` constructs.

For this example we assume we will have the folder structure to be as shown below. We have two folders, one containing 
the `PySpark` application called `spark` and a second containing the `CDK` code. 
The PySpark code, follows the standards `Python` structure. The `spark` also contains the Dockerfile to build the `venv`. 
In the next section will describe how to structure the `Dockerfile`. 

```bash
root
|--spark
|    |--test
|    |--src
        |--__init__.py
|       |--entrypoint.py
        |--dir1
          |--__init__.py
          |--helpers.py
|    |--requirement.txt
|    |--Dockerfile #contains the build instructions to package the virtual environment for PySpark
|--cdk
```

### Dockerfile definition


```Dockerfile
FROM --platform=linux/amd64 public.ecr.aws/amazonlinux/amazonlinux:2 AS base

RUN yum install -y python3 

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /spark

COPY . .

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install venv-pack==0.2.0 && \
    python3 -m pip install .

RUN mkdir /output && venv-pack -o /output/pyspark-env.tar.gz && chmod ugo+r /output/pyspark-env.tar.gz
```


```python
from aws_cdk import RemovalPolicy
from aws_dsf import (
  SparkEmrServerlessRuntime,
  SparkEmrServerlessJob, 
  SparkEmrServerlessJobProps,
  PySparkApplicationPackage
)

spark_runtime = SparkEmrServerlessRuntime(self, "SparkProcessingRuntime", name="nightly-job-aggregation")


pyspark_app = PySparkApplicationPackage(
                self,
                "PySparkApplicationPackage",
                entrypoint_path="./../spark/src/entrypoint.py",
                pyspark_application_name="nightly-job-aggregation",
                dependencies_folder="./../spark",
                venv_archive_path="./../spark/requirements.txt",
                removal_policy=RemovalPolicy.DESTROY
              )

spark_job_params = SparkEmrServerlessJobProps(
                    name="nightly-job",
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