# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import (
    RemovalPolicy,
    Stack,
)
from constructs import Construct
from aws_cdk.aws_iam import PolicyStatement
from aws_cdk.pipelines import CodePipelineSource
import cdklabs.aws_data_solutions_framework as dsf
from stacks.application_stack import SparkApplicationStackFactory


class CICDPipelineStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        dsf.processing.SparkEmrCICDPipeline(
            self,
            "SparkCICDPipeline",
            spark_application_name="SparkTest",
            # The Spark image to use in the CICD
            spark_image=dsf.processing.SparkImage.EMR_7_5,
            # Pass the factory class to dynamically pass the Application Stack
            application_stack_factory=SparkApplicationStackFactory(),
            # Path of the CDK python application to be used by the CICD build and deploy phases
            cdk_application_path="infra",
            # Path of the Spark application to be built and unit tested in the CICD
            spark_application_path="spark",
            # Path of the bash script responsible to run integration tests 
            integ_test_script='./infra/resources/integ-test.sh',
            # Environment variables used by the integration test script
            integ_test_env={
                "STEP_FUNCTION_ARN": "ProcessingStateMachineArn"
            },
            # Additional permissions to give to the CICD to run the integration tests
            integ_test_permissions=[
                PolicyStatement(
                    actions=["states:StartExecution", "states:DescribeExecution"
                    ],
                    resources=["*"]
                )
            ],
            source= CodePipelineSource.connection("vgkowski/spark-data-lake-example", "main",
                connection_arn="arn:aws:codeconnections:us-east-1:632368511077:connection/84f1c621-a895-449a-b661-ff7f0e437ab4"
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )
