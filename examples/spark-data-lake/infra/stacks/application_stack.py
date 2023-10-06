# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import Stack, RemovalPolicy, Duration, CustomResource, Names
from aws_cdk.aws_iam import *
from aws_cdk.aws_lambda import *
from aws_cdk.aws_events import *
from aws_cdk.aws_events_targets import LambdaFunction
from aws_cdk.custom_resources import *
from aws_cdk.aws_s3_deployment import *
from constructs import Construct
from aws_dsf import DataLakeStorage, SparkEmrServerlessRuntime, SparkEmrServerlessJob, SparkEmrServerlessJobProps, DataCatalogDatabase

class ApplicationStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.node.set_context('@aws-data-solutions-framework/removeDataOnDestroy', True)
    
    sample_data_bucket_name = "nyc-tlc"
    sample_data_bucket_prefix = "trip data/"
    sample_data_bucket_arn = F"arn:aws:s3:::{sample_data_bucket_name}"

    storage = DataLakeStorage(self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY)
    copy_sample_function_name = F"copy-sample-data-{Names.unique_resource_name(self)}"

    copy_sample_role = Role(
      self, 
      "CopySampleRole", 
      assumed_by=ServicePrincipal("lambda.amazonaws.com"),
      inline_policies={
        "AllowLogging": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              resources=[
                F"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/{copy_sample_function_name}",
                F"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/{copy_sample_function_name}:log-stream:*"
              ]
            )
          ]
        ),
        "AllowS3AccessToSampleData": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "s3:GetObject",
                "s3:ListBucket"
              ],
              resources=[
                sample_data_bucket_arn,
                F"{sample_data_bucket_arn}/*"
              ]
            )
          ]
        )
      }
    )

    storage.bronze_bucket.grant_read_write(copy_sample_role)

    copy_sample_function = Function(
      self, 
      "CopySampleFunction",
      runtime=Runtime.NODEJS_LATEST,
      role=copy_sample_role,
      code=Code.from_asset("./stacks/copy_sample_function/"),
      handler="index.handler",
      timeout=Duration.minutes(15),
      function_name=copy_sample_function_name,
      environment={
        "SOURCE_BUCKET_NAME": sample_data_bucket_name,
        "SOURCE_BUCKET_PREFIX": sample_data_bucket_prefix,
        "SOURCE_BUCKET_REGION": "us-east-1",
        "TARGET_BUCKET_NAME": storage.bronze_bucket.bucket_name,
        "TARGET_BUCKET_PREFIX": "nyc-taxi/"
      }
    )

    copy_provider = Provider(self, "CopyProvider", on_event_handler=copy_sample_function)

    CustomResource(self, "CopyCustomResource", service_token=copy_provider.service_token)

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

    silver_nyc_taxi_db = DataCatalogDatabase(
      self,
      "SilverNycTaxiDatabase",
      name="nyc_taxi",
      location_bucket=storage.silver_bucket,
      location_prefix="nyc_taxis/",
      removal_policy=RemovalPolicy.DESTROY
    )

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

    start_taxi_crawler_function_name = F"start-taxi-crawler-{Names.unique_resource_name(self)}"

    start_taxi_crawler_role = Role(
      self, 
      "StartTaxiCrawlerRole", 
      assumed_by=ServicePrincipal("lambda.amazonaws.com"),
      inline_policies={
        "AllowLogging": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              resources=[
                F"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/{start_taxi_crawler_function_name}",
                F"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/{start_taxi_crawler_function_name}:log-stream:*"
              ]
            )
          ]
        ),
        "StartCrawler": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "glue:StartCrawler"
              ],
              resources=[
                F"arn:aws:glue:{self.region}:{self.account}:crawler/{silver_nyc_taxi_db.crawler.ref}"
              ]
            )
          ]
        )
      }
    )

    start_taxi_crawler_function = Function(
      self, 
      "StartTaxiCrawlerFunction",
      runtime=Runtime.NODEJS_LATEST,
      role=start_taxi_crawler_role,
      code=Code.from_asset("./stacks/trigger_crawler_function/"),
      handler="index.handler",
      timeout=Duration.minutes(1),
      function_name=start_taxi_crawler_function_name,
      environment={
        "TARGET_CRAWLER_NAME": silver_nyc_taxi_db.crawler.ref
      }
    )

    Rule(
      self,
      "TriggerTaxiCrawlerAfterSpark",
      event_pattern=EventPattern(
        source=["aws.states"],
        detail_type=["Step Functions Execution Status Change"],
        detail={
          "status": ["SUCCEEDED"],
          "stateMachineArn": [spark_job.state_machine.state_machine_arn]
        }
      ),
      targets=[
        LambdaFunction(start_taxi_crawler_function)
      ]
    )

    AwsCustomResource(
      self,
      "StartSparkProcessingStateMachine",
      on_create=AwsSdkCall(
        service="StepFunctions",
        action="startExecution",
        parameters={
          "stateMachineArn": spark_job.state_machine.state_machine_arn
        },
        physical_resource_id=PhysicalResourceId.of(F"StartSparkProcessingStateMachine-{Names.unique_resource_name(self)}")
      ),
      policy=AwsCustomResourcePolicy.from_sdk_calls(
        resources=[
          spark_job.state_machine.state_machine_arn
        ]
      )
    )
    
