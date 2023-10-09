# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import Aws, CustomResource, Duration, Names
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk.custom_resources import Provider
from constructs import Construct

import aws_dsf as dsf


class DataLoad(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        src_bucket_name: str,
        src_bucket_prefix: str,
        storage: dsf.DataLakeStorage,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        fn_name = f"copy-sample-data-{Names.unique_resource_name(self)}"
        bucket_arn = f"arn:aws:s3:::{src_bucket_name}"

        copy_sample_role = iam.Role(
            self,
            "CopySampleRole",
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
                                f"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{fn_name}",
                                f"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{fn_name}:log-stream:*",
                            ],
                        )
                    ]
                ),
                "AllowS3AccessToSampleData": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:GetObject", "s3:ListBucket"],
                            resources=[
                                bucket_arn,
                                f"{bucket_arn}/*",
                            ],
                        )
                    ]
                ),
            },
        )
        storage.bronze_bucket.grant_read_write(copy_sample_role)

        copy_sample_function = _lambda.Function(
            self,
            "CopySampleFunction",
            runtime=_lambda.Runtime.NODEJS_LATEST,
            role=copy_sample_role,
            code=_lambda.Code.from_asset("./stacks/demo_helpers/copy_sample_function/"),
            handler="index.handler",
            timeout=Duration.minutes(15),
            environment={
                "SOURCE_BUCKET_NAME": src_bucket_name,
                "SOURCE_BUCKET_PREFIX": src_bucket_prefix,
                "SOURCE_BUCKET_REGION": "us-east-1",
                "TARGET_BUCKET_NAME": storage.bronze_bucket.bucket_name,
                "TARGET_BUCKET_PREFIX": "nyc-taxi/",
            },
        )
        copy_provider = Provider(
            self, "CopyProvider", on_event_handler=copy_sample_function
        )
        CustomResource(
            self, "CopyCustomResource", service_token=copy_provider.service_token
        )
