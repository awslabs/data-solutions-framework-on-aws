# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import Stack, RemovalPolicy, Duration, Aws, Names
from aws_cdk.aws_iam import *
from aws_cdk.aws_lambda import *
from aws_cdk.aws_events import *
from aws_cdk.aws_events_targets import LambdaFunction
from aws_cdk.custom_resources import *
from aws_cdk.aws_s3_deployment import *
from constructs import Construct
from aws_dsf import DataCatalogDatabase

class JobTrigger(Construct):
  def __init__(self, scope: Construct, construct_id: str, spark_job, storage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    silver_nyc_taxi_db = DataCatalogDatabase(
      self,
      "SilverNycTaxiDatabase",
      name="nyc_taxi",
      location_bucket=storage.silver_bucket,
      location_prefix="nyc_taxis/",
      removal_policy=RemovalPolicy.DESTROY
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
                F"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{start_taxi_crawler_function_name}",
                F"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{start_taxi_crawler_function_name}:log-stream:*"
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
                F"arn:aws:glue:{Aws.REGION}:{Aws.ACCOUNT_ID}:crawler/{silver_nyc_taxi_db.crawler.ref}"
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
      code=Code.from_asset("./stacks/demo_helpers/trigger_crawler_function/"),
      handler="index.handler",
      timeout=Duration.minutes(1),
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


    