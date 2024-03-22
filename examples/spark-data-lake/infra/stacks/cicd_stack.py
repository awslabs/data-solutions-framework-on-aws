# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import (
    RemovalPolicy,
    Stack,
)
from constructs import Construct
from aws_cdk.aws_iam import PolicyStatement

import cdklabs.aws_data_solutions_framework as dsf
from stacks.application_stack import SparkApplicationStackFactory


class CICDPipelineStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        dsf.processing.SparkEmrCICDPipeline(
            self,
            "SparkCICDPipeline",
            spark_application_name="SparkTest",
            application_stack_factory=SparkApplicationStackFactory(),
            cdk_application_path="infra",
            spark_application_path="spark",
            integ_test_script='./infra/resources/integ-test.sh',
            integ_test_env={
                "STEP_FUNCTION_ARN": "ProcessingStateMachineArn"
            },
            integ_test_permissions=[
                PolicyStatement(
                    actions=["states:StartExecution", "states:DescribeExecution"
                    ],
                    resources=["*"]
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
        )
