# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
from aws_cdk import Stack, RemovalPolicy, CfnOutput
from constructs import Construct
from aws_cdk.aws_s3 import Bucket
import aws_dsf as dsf


class DataStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    storage = dsf.storage.DataLakeStorage(
            self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY
        )
    
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

    
    # Use DSF on AWS to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
    spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )

    processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

    storage.bronze_bucket.grant_read_write(processing_exec_role)
    storage.silver_bucket.grant_read_write(processing_exec_role)

    CfnOutput(self, "EMRServerlessApplicationId", value=spark_runtime.application.attr_application_id)
    CfnOutput(self, "EMRServerlessApplicationARN", value=spark_runtime.application.attr_arn)
    CfnOutput(self, "EMRServelessExecutionRoleARN", value=processing_exec_role.role_arn)
