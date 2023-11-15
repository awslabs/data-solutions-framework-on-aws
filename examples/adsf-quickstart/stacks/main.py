import os
from aws_cdk import Stack, RemovalPolicy
from constructs import Construct
import aws_dsf as dsf


class DataStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    storage = dsf.storage.DataLakeStorage(
            self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY
        )

    catalog = dsf.governance.DataLakeCatalog(
            self, "DataLakeCatalog",
            data_lake_storage=storage,
            database_name='spark_data_lake',
            removal_policy=RemovalPolicy.DESTROY,
        )
    
    # Use DSF on AWS to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
    spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )

    processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

    storage.gold_bucket.grant_read_write(processing_exec_role)
    storage.silver_bucket.grant_read(processing_exec_role)
