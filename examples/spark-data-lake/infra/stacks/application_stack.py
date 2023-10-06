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
  PySparkApplicationPackage
)

from stacks.demo_helpers.data_load import DataLoad
from stacks.demo_helpers.job_trigger import JobTrigger

class SparkApplicationStackFactory(ApplicationStackFactory):
  
  def create_stack(self, scope: Construct, stage: CICDStage) -> Stack:
    return ApplicationStack(scope, 'EmrApplicationStack', stage)


class ApplicationStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, stage: CICDStage=None, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    
    sample_data_bucket_name = "nyc-tlc"
    sample_data_bucket_prefix = "trip data/"
    sample_data_bucket_arn = F"arn:aws:s3:::{sample_data_bucket_name}"

    storage = DataLakeStorage(self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY)
    copy_sample_function_name = F"copy-sample-data-{Names.unique_resource_name(self)}"

    #Helper to load data to bronze bucket
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


    pyspark_app = PySparkApplicationPackage(
      self,
      "PySparkApplicationPackage",
      entrypoint_path="./../spark/src/agg_trip_distance.py",
      pyspark_application_name="taxi-trip-aggregation",
      removal_policy=RemovalPolicy.DESTROY
    )

    spark_job_params = SparkEmrServerlessJobProps(
      name=f"taxi-agg-job-{Names.unique_resource_name(self)}",
      application_id=spark_runtime.application_id,
      execution_role_arn=processing_exec_role.role_arn,
      spark_submit_entry_point=pyspark_app.entrypoint_s3_uri,
      spark_submit_parameters=f"--conf spark.emr-serverless.driverEnv.SOURCE_LOCATION=s3://{storage.bronze_bucket.bucket_name}/nyc-taxi --conf spark.emr-serverless.driverEnv.TARGET_LOCATION=s3://{storage.silver_bucket.bucket_name}"
    )

    spark_job = SparkEmrServerlessJob(
      self, 
      "SparkProcessingJob",
      spark_job_params
    )

    #Helper to trigger job for demo purpose
    #The construct for SparkJob takes a CRON to trigger the job
    JobTrigger(self, "JobTrigger", spark_job, storage)
    
