# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import Duration, Aws, Names
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_events as events
from aws_cdk import custom_resources as cr
from aws_cdk.aws_events_targets import LambdaFunction
from constructs import Construct

import cdklabs.aws_data_solutions_framework as dsf


class SparkJobTrigger(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        spark_job: dsf.processing.SparkEmrServerlessJob,
        db: dsf.governance.DataCatalogDatabase,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        start_taxi_crawler_function_name = (
            f"start-taxi-crawler-{Names.unique_resource_name(self)}"
        )

        start_taxi_crawler_role = iam.Role(
            self,
            "StartTaxiCrawlerRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            inline_policies={
                "AllowLogging": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                            ],
                            resources=[
                                f"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{start_taxi_crawler_function_name}",
                                f"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{start_taxi_crawler_function_name}:log-stream:*",
                            ],
                        )
                    ]
                ),
                "StartCrawler": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["glue:StartCrawler"],
                            resources=[
                                f"arn:aws:glue:{Aws.REGION}:{Aws.ACCOUNT_ID}:crawler/{db.crawler.ref}"
                            ],
                        )
                    ]
                ),
            },
        )

        start_taxi_crawler_function = _lambda.Function(
            self,
            "StartTaxiCrawlerFunction",
            runtime=_lambda.Runtime.NODEJS_LATEST,
            role=start_taxi_crawler_role,
            code=_lambda.Code.from_asset(
                "./stacks/demo_helpers/trigger_crawler_function/"
            ),
            handler="index.handler",
            timeout=Duration.minutes(1),
            environment={"TARGET_CRAWLER_NAME": db.crawler.ref},
        )

        events.Rule(
            self,
            "TriggerTaxiCrawlerAfterSpark",
            event_pattern=events.EventPattern(
                source=["aws.states"],
                detail_type=["Step Functions Execution Status Change"],
                detail={
                    "status": ["SUCCEEDED"],
                    "stateMachineArn": [spark_job.state_machine.state_machine_arn],
                },
            ),
            targets=[LambdaFunction(start_taxi_crawler_function)],
        )

        cr.AwsCustomResource(
            self,
            "StartSparkProcessingStateMachine",
            on_create=cr.AwsSdkCall(
                service="StepFunctions",
                action="startExecution",
                parameters={
                    "stateMachineArn": spark_job.state_machine.state_machine_arn
                },
                physical_resource_id=cr.PhysicalResourceId.of(
                    f"StartSparkProcessingStateMachine-{Names.unique_resource_name(self)}"
                ),
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=[spark_job.state_machine.state_machine_arn]
            ),
        )
