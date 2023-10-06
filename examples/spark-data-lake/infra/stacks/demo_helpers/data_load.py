# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import Duration, CustomResource, Aws
from aws_cdk.aws_iam import *
from aws_cdk.aws_lambda import *
from aws_cdk.aws_events import *
from aws_cdk.custom_resources import *
from aws_cdk.aws_s3_deployment import *
from constructs import Construct
import os

class DataLoad(Construct):
  def __init__(self, scope: Construct, construct_id: str, sample_data_bucket_name, copy_sample_function_name, sample_data_bucket_prefix, sample_data_bucket_arn, storage, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

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
                F"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{copy_sample_function_name}",
                F"arn:aws:logs:{Aws.REGION}:{Aws.ACCOUNT_ID}:log-group:/aws/lambda/{copy_sample_function_name}:log-stream:*"
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

    copy_sample_function = Function(
      self, 
      "CopySampleFunction",
      runtime=Runtime.NODEJS_LATEST,
      role=copy_sample_role,
      code=Code.from_asset("./stacks/demo_helpers/copy_sample_function/"),
      handler="index.handler",
      timeout=Duration.minutes(15),
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

    storage.bronze_bucket.grant_read_write(copy_sample_role)