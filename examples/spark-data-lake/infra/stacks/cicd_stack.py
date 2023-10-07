# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from aws_cdk import (
  RemovalPolicy,
  Stack, 
)
from aws_dsf import SparkEmrCICDPipeline
from constructs import Construct

from stacks.application_stack import SparkApplicationStackFactory


class CICDPipelineStack(Stack):

  def __init__(self, scope: Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)

    SparkEmrCICDPipeline(self, "SparkCICDPipeline",
      application_name="SparkTest",
      application_stack_factory=SparkApplicationStackFactory(),
      cdk_application_path='infra',
      spark_application_path='spark'
    )