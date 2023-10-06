# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

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
)

from stacks.demo_helpers.data_load import DataLoad
from stacks.demo_helpers.job_trigger import JobTrigger

class SparkApplicationStackFactory(ApplicationStackFactory):
  
  def create_stack(self, scope: Construct, stage: CICDStage) -> Stack:
    return ApplicationStack(scope, 'EmrApplicationStack', stage)


class ApplicationStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, stage: CICDStage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.node.set_context('@aws-data-solutions-framework/removeDataOnDestroy', True)
    
    sample_data_bucket_name = "nyc-tlc"
    sample_data_bucket_prefix = "trip data/"
    sample_data_bucket_arn = F"arn:aws:s3:::{sample_data_bucket_name}"

    storage = DataLakeStorage(self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY)
    copy_sample_function_name = F"copy-sample-data-{Names.unique_resource_name(self)}"

    DataLoad(self, "DataLoad", sample_data_bucket_name, copy_sample_function_name, sample_data_bucket_prefix, sample_data_bucket_arn, storage)

    processing_policy_doc = PolicyDocument(statements=[
      PolicyStatement(
        effect=Effect.ALLOW,
        actions=[
          "s3:GetObject",
          "s3:PutObject"
        ],
        resources=[
          F"{storage.bronze_bucket.bucket_arn}/*",
          F"{storage.silver_bucket.bucket_arn}/*"
        ]
      )
    ])

    processing_exec_role = SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole", processing_policy_doc)

    storage.bronze_bucket.grant_read_write(processing_exec_role)
    storage.silver_bucket.grant_read_write(processing_exec_role)

    spark_runtime = SparkEmrServerlessRuntime(self, "SparkProcessingRuntime", name="TaxiAggregation")

    BucketDeployment(
      self, 
      "UploadSparkScript",
      sources=[
        Source.asset("./stacks/spark_script/")
      ],
      destination_bucket=storage.silver_bucket,
      destination_key_prefix="spark_script/"
    )

    spark_job_params = SparkEmrServerlessJobProps(
      name=F"taxi-agg-job-{Names.unique_resource_name(self)}",
      application_id=spark_runtime.application_id,
      execution_role_arn=processing_exec_role.role_arn,
      spark_submit_entry_point=F"s3://{storage.silver_bucket.bucket_name}/spark_script/agg_trip_distance.py",
      spark_submit_parameters=F"--conf spark.emr-serverless.driverEnv.SOURCE_LOCATION=s3://{storage.bronze_bucket.bucket_name}/nyc-taxi --conf spark.emr-serverless.driverEnv.TARGET_LOCATION=s3://{storage.silver_bucket.bucket_name}",
      RemovalPolicy= RemovalPolicy.DESTROY
    )

    spark_job = SparkEmrServerlessJob(
      self, 
      "SparkProcessingJob",
      spark_job_params
    )

    JobTrigger(self, "JobTrigger", spark_job, storage)
    
