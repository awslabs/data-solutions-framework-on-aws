# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import Stack, RemovalPolicy, Names
from aws_cdk import aws_iam as iam
from constructs import Construct
import aws_dsf as dsf

from stacks.demo_helpers.data_load import DataLoad
from stacks.demo_helpers.spark_job_trigger import SparkJobTrigger


class SparkApplicationStackFactory(dsf.ApplicationStackFactory):
    """Implements ApplicationStackFactory from AWS DSF to create a self-mutable CICD pipeline for Spark app.
    See Spark CICD docs for more details."""

    def create_stack(self, scope: Construct, stage: dsf.CICDStage) -> Stack:
        return ApplicationStack(scope, "EmrApplicationStack", stage)


class ApplicationStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, stage: dsf.CICDStage = None, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Use AWS DSF to create a data lake storage and Glue data catalog database for the example data.
        storage = dsf.DataLakeStorage(
            self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY
        )

        catalog = dsf.DataLakeCatalog(
            self, "DataLakeCatalog", 
            removal_policy=RemovalPolicy.DESTROY
        )
        # silver_nyc_taxi_db = dsf.DataCatalogDatabase(
        #     self,
        #     "SilverNycTaxiDatabase",
        #     name="nyc_taxi",
        #     location_bucket=storage.silver_bucket,
        #     location_prefix="nyc_taxis/",
        #     removal_policy=RemovalPolicy.DESTROY,
        # )

        # Helper to load example data to bronze bucket. For the demo purposes only.
        DataLoad(
            self,
            "DataLoad",
            src_bucket_name="nyc-tlc",
            src_bucket_prefix="trip data/",
            storage=storage,
        )

        processing_policy_doc = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject*",
                        "s3:GetBucket*",
                        "s3:List*",
                        "s3:DeleteObject*",
                        "s3:PutObject",
                        "s3:PutObjectTagging",
                        "s3:PutObjectVersionTagging",
                        "s3:Abort*"
                    ],
                    resources=[
                        f"{storage.bronze_bucket.bucket_arn}/*",
                        f"{storage.silver_bucket.bucket_arn}/*",
                        storage.silver_bucket.bucket_arn,
                        storage.bronze_bucket.bucket_arn
                    ],
                )
            ]
        )

        processing_exec_role = dsf.SparkEmrServerlessRuntime.create_execution_role(
            self, "ProcessingExecRole", processing_policy_doc
        )

        storage.bronze_bucket.grant_read_write(processing_exec_role)
        storage.silver_bucket.grant_read_write(processing_exec_role)

        # Use AWS DSF to create Spark EMR serverless runtime, package Spark app, and create a Spark job.
        spark_runtime = dsf.SparkEmrServerlessRuntime(
            self, "SparkProcessingRuntime", 
            name="TaxiAggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )
        spark_app = dsf.PySparkApplicationPackage(
            self,
            "PySparkApplicationPackage",
            entrypoint_path="./../spark/src/agg_trip_distance.py",
            application_name="taxi-trip-aggregation",
            removal_policy=RemovalPolicy.DESTROY,
        )

        spark_app.artifacts_bucket.grant_read_write(processing_exec_role)

        params = (
            f"--conf"
            f" spark.emr-serverless.driverEnv.SOURCE_LOCATION=s3://{storage.silver_bucket.bucket_name}/nyc-taxi"
            f" --conf spark.emr-serverless.driverEnv.TARGET_LOCATION=s3://{storage.gold_bucket.bucket_name}"
        )

        spark_job = dsf.SparkEmrServerlessJob(
            self,
            "SparkProcessingJob",
            dsf.SparkEmrServerlessJobProps(
                name=f"taxi-agg-job-{Names.unique_resource_name(self)}",
                application_id=spark_runtime.application_id,
                execution_role_arn=processing_exec_role.role_arn,
                spark_submit_entry_point=spark_app.entrypoint_s3_uri,
                spark_submit_parameters=params,
            ),
        )

        # Helper with the custom resource to trigger the Spark job. For the demo purposes only.
        SparkJobTrigger(self, "JobTrigger", spark_job=spark_job, db=catalog.gold_catalog_database)
