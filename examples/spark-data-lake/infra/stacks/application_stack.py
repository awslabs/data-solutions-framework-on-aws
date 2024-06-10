# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import CfnOutput, Stack, RemovalPolicy, Names, Duration
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_events as events
from constructs import Construct
import cdklabs.aws_data_solutions_framework as dsf
from aws_cdk.aws_s3 import Bucket


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

        # Import the S3 bucket used as the Spark job source
        source_bucket = s3.Bucket.from_bucket_name(self, 'SourceBucket', 'nyc-tlc')

        # Copy the Yellow taxi data in the silver bucket of the data lake
        dsf.utils.S3DataCopy(
            self,
            "YellowDataCopy",
            source_bucket=source_bucket,
            source_bucket_prefix="trip data/yellow_tripdata_2019",
            source_bucket_region="us-east-1",
            target_bucket= storage.silver_bucket,
            target_bucket_prefix="yellow-trip-data/",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Copy the the Green taxi data in the silver bucket of the data lake
        dsf.utils.S3DataCopy(
            self,
            "GreenDataCopy",
            source_bucket=source_bucket,
            source_bucket_prefix="trip data/green_tripdata_2019",
            source_bucket_region="us-east-1",
            target_bucket= storage.silver_bucket,
            target_bucket_prefix="green-trip-data/",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create an execution role for the Spark job on EMR Serverless
        processing_exec_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, "ProcessingExecRole")

        # Grant the execution role read permissions on silver bucket and write permissions on target bucket
        # Note: buckets are created as part of the same stack so the grants on the encryption key are automatic
        storage.gold_bucket.grant_read_write(processing_exec_role)
        storage.silver_bucket.grant_read(processing_exec_role)
        
        # Grant the execution role permissions to write to the Gold database
        account = Stack.of(self).account
        region = Stack.of(self).region
        target_db = catalog.gold_catalog_database.database_name
        target_table = 'aggregated_trip_distance'
        processing_exec_role.add_to_principal_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                'glue:CreateTable',
                'glue:GetTable',
                'glue:GetTables',
                'glue:BatchGetPartition',
                'glue:GetDatabase',
                'glue:GetDatabases',
                ],
                resources=[
                    f"arn:aws:glue:{region}:{account}:catalog",
                    f"arn:aws:glue:{region}:{account}:database/default",
                    f"arn:aws:glue:{region}:{account}:database/{target_db}",
                    f"arn:aws:glue:{region}:{account}:table/{target_db}/{target_table}",
                ],
            )
        )

        # Create the Spark EMR serverless runtime with Glue catalog support
        spark_runtime = dsf.processing.SparkEmrServerlessRuntime(
            self, 
            "SparkProcessingRuntime", 
            name="TaxiAggregation",
            runtime_configuration=[
                {
                    "classification": "spark-defaults",
                    "properties": {
                    "spark.hadoop.hive.metastore.client.factory.class":
                        "com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory",
                    "spark.sql.catalogImplementation": "hive",
                    },
                },
            ],
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Package the Spark code and its dependencies to be used by the Spark EMR Serverless job
        spark_app = dsf.processing.PySparkApplicationPackage(
            self,
            "SparkApp",
            entrypoint_path="./../spark/src/agg_trip_distance.py",
            application_name="TaxiAggregation",
            # Path of the Dockerfile responsible to package the dependencies as a Python venv
            dependencies_folder='./../spark',
            # Path of the venv archive in the docker image
            venv_archive_path="/venv-package/pyspark-env.tar.gz",
            removal_policy=RemovalPolicy.DESTROY
        )

        # Grant the execution role read permission on the artifact bucket
        spark_app.artifacts_bucket.grant_read_write(processing_exec_role)

        # Pass the source and target parameters to the Spark job
        spark_params = (
            f" --conf spark.emr-serverless.driverEnv.YELLOW_SOURCE=s3://{storage.silver_bucket.bucket_name}/yellow-trip-data/"
            f" --conf spark.emr-serverless.driverEnv.GREEN_SOURCE=s3://{storage.silver_bucket.bucket_name}/green-trip-data/"
            f" --conf spark.emr-serverless.driverEnv.TARGET_DB={catalog.gold_catalog_database.database_name}"
            f" --conf spark.emr-serverless.driverEnv.TARGET_TABLE={target_table}"
        )

        # Change the scheduling of the Spark job based on the stage of the CICD
        # When deploying in staging environment, the job is not triggered (because it will be triggered by the CICD)
        if (stage == dsf.utils.CICDStage.PROD):
            schedule = events.Schedule.rate(Duration.days(1))
        else:
            schedule = None

        # Create the Spark job on the EMR Serverless runtime
        spark_job = dsf.processing.SparkEmrServerlessJob(
            self,
            "SparkProcessingJob",
            dsf.processing.SparkEmrServerlessJobProps(
                name=f"taxi-agg-job-{Names.unique_resource_name(self)}",
                # ID of the previously created EMR Servverless runtime
                application_id=spark_runtime.application.attr_application_id,
                execution_role=processing_exec_role,
                spark_submit_entry_point=spark_app.entrypoint_uri,
                # Add the Spark parameters from the PySpark package to configure the dependencies (using venv)
                spark_submit_parameters=spark_app.spark_venv_conf + spark_params,
                removal_policy=RemovalPolicy.DESTROY,
                schedule= schedule,
            )
        )

        # Create an Athena workgroup for querying results of the job
        dsf.consumption.AthenaWorkGroup(self, 'InteractiveQuery',
            name='discovery',
            result_location_prefix='athena-results',
            publish_cloud_watch_metrics_enabled=False,
            engine_version=dsf.consumption.EngineVersion.ATHENA_V3,
            recursive_delete_option=True,
            removal_policy=RemovalPolicy.DESTROY,
            results_retention_period=Duration.days(1),
        )

        # Generate a CloudFormation output with the Step Functions ARN 
        # to be used by the CICD for the integration tests
        CfnOutput(self, "ProcessingStateMachineArn",
            value=spark_job.state_machine.state_machine_arn
        )
