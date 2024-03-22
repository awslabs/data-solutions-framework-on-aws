# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import CfnOutput, Stack, RemovalPolicy, Names, Duration
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_events as events
from constructs import Construct
import cdklabs.aws_data_solutions_framework as dsf
from aws_cdk.aws_s3 import Bucket

from stacks.demo_helpers.spark_job_trigger import SparkJobTrigger


class SparkApplicationStackFactory(dsf.utils.ApplicationStackFactory):
    """Implements ApplicationStackFactory from DSF on AWS to create a self-mutable CICD pipeline for Spark app.
    See Spark CICD docs for more details."""

    def create_stack(self, scope: Construct, stage: dsf.utils.CICDStage) -> Stack:
        return ApplicationStack(scope, "EmrApplicationStack", stage)


class ApplicationStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, stage: dsf.utils.CICDStage=None, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Use DSF on AWS to create a data lake storage and Glue data catalog database for the example data.
        storage = dsf.storage.DataLakeStorage(
            self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY
        )

        catalog = dsf.governance.DataLakeCatalog(
            self, "DataLakeCatalog",
            data_lake_storage=storage,
            database_name='spark_data_lake',
            removal_policy=RemovalPolicy.DESTROY,
        )

        dsf.utils.S3DataCopy(
             self,
            "SourceDataCopy",
            source_bucket=Bucket.from_bucket_name(self, 'SourceBucket', 'nyc-tlc'),
            source_bucket_prefix="trip data/",
            source_bucket_region="us-east-1",
            target_bucket= storage.silver_bucket,
            target_bucket_prefix="trip-data/",
        )

        processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

        storage.gold_bucket.grant_read_write(processing_exec_role)
        storage.silver_bucket.grant_read(processing_exec_role)

        # Use DSF on AWS to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
        spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, 
            "SparkProcessingRuntime", 
            name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )
        spark_app = dsf.processing.PySparkApplicationPackage(
            self,
            "SparkApp",
            entrypoint_path="./../spark/src/agg_trip_distance.py",
            application_name="TaxiAggregation",
            dependencies_folder='./../spark',
            venv_archive_path="/venv-package/pyspark-env.tar.gz",
            removal_policy=RemovalPolicy.DESTROY
        )

        spark_app.artifacts_bucket.grant_read_write(processing_exec_role)

        params = (
            f"--conf"
            f" spark.emr-serverless.driverEnv.SOURCE_LOCATION=s3://{storage.silver_bucket.bucket_name}/trip-data/"
            f" --conf spark.emr-serverless.driverEnv.TARGET_LOCATION=s3://{storage.gold_bucket.bucket_name}/aggregated-trip-data/"
        )

        if (stage == dsf.utils.CICDStage.PROD):
            schedule = events.Schedule.rate(Duration.days(1))
        else:
            schedule = None

        spark_job = dsf.processing.SparkEmrServerlessJob(
            self,
            "SparkProcessingJob",
            dsf.processing.SparkEmrServerlessJobProps(
                name=f"taxi-agg-job-{Names.unique_resource_name(self)}",
                application_id=spark_runtime.application.attr_application_id,
                execution_role=processing_exec_role,
                spark_submit_entry_point=spark_app.entrypoint_uri,
                spark_submit_parameters=spark_app.spark_venv_conf + params,
                removal_policy=RemovalPolicy.DESTROY,
                schedule= schedule,
            )
        )

        CfnOutput(self, "ProcessingStateMachineArn",
            value=spark_job.state_machine.state_machine_arn
        )
