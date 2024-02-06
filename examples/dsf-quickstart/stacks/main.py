# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import Stack, RemovalPolicy, CfnOutput
from aws_cdk.aws_iam import Policy, PolicyStatement
from aws_cdk.aws_kms import Key
from constructs import Construct
from aws_cdk.aws_s3 import Bucket
import aws_data_solutions_framework as dsf


class DataStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    storage = dsf.storage.AnalyticsBucket(
            self, "DataLakeStorage", 
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key= Key(self, "StorageEncryptionKey",
                removal_policy=RemovalPolicy.DESTROY,
                enable_key_rotation=True
            )
        )
  
    # Use DSF on AWS to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
    spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )
    
    s3_read_policy = Policy(self, 'S3ReadPolicy',
          statements=[
              PolicyStatement(
                  actions = ["s3:GetObject", "s3:ListBucket"],
                  resources = ["arn:aws:s3:::*.elasticmapreduce/*", "arn:aws:s3:::*.elasticmapreduce"]
              )
          ]
      )

    processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

    processing_exec_role.attach_inline_policy(s3_read_policy)

    storage.grant_read_write(processing_exec_role)

    CfnOutput(self, "EMRServerlessApplicationId", value=spark_runtime.application.attr_application_id)
    CfnOutput(self, "EMRServerlessApplicationARN", value=spark_runtime.application.attr_arn)
    CfnOutput(self, "EMRServelessExecutionRoleARN", value=processing_exec_role.role_arn)
    CfnOutput(self, "BucketURI", value=f"s3://{storage.bucket_name}")
