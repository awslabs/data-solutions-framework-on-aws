---
sidebar_position: 6
sidebar_label: Spark Job
---

# Spark job

A construct to create a step function which submit a Spark job. The step function can submit a job with either [Amazon EMR on EKS](https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/getting-started.html) or [Amazon EMR Serverless](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/getting-started.html). 

## Overview

The construct creates an AWS Step Function that is used to submit the job and orchestarte the life cycle of a job. The construct leverage the [AWS SDK service integrations](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html) to submit the jobs. The step function can takes a cron expression to trigger the job at a given interval. 


![Spark Job State Machine](../../../static/img/adsf-spark-job-statemachine.svg)

## Usage

The code snipet below shows a usage exampe of the SparkEmrServerlessRuntime construct.

```python

from aws_cdk import core
from adsf import SparkRuntimeServerless
from aws_cdk.aws_iam import PolicyStatement, Role, PolicyDocument


```