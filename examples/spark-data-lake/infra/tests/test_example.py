# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
import os
from aws_cdk import App, Aspects, Environment
from aws_cdk.assertions import Template, Annotations, Match
from cdk_nag import NagSuppressions, AwsSolutionsChecks
from constructs import Construct, Node
from stacks.application_stack import ApplicationStack
from stacks.cicd_stack import CICDPipelineStack
from tests.nag_suppressions import suppress_nag


@pytest.fixture(scope="module")
def results():
    app = App()
    app.node.set_context('staging', { 'accountId': '123456789012', 'region': 'eu-west-1' })
    app.node.set_context('prod', { 'accountId': '123456789012', 'region': 'eu-west-1' })
    stack = ApplicationStack(app, "my-stack-test")
    cicd_stack = CICDPipelineStack(scope=app, id='my-cicdstack-test', 
        env=Environment(region='eu-west-1'), 
    )

    Aspects.of(stack).add(AwsSolutionsChecks(verbose=True))
    Aspects.of(cicd_stack).add(AwsSolutionsChecks(verbose=True))

    suppress_nag(stack, 'DataLakeStorage')
    suppress_nag(stack, 'DataLakeCatalog')
    suppress_nag(stack, 'YellowDataCopy')
    suppress_nag(stack, 'GreenDataCopy')
    suppress_nag(stack, 'ProcessingExecRole')
    suppress_nag(stack, 'SparkProcessingRuntime')
    suppress_nag(stack, 'SparkApp')
    suppress_nag(stack, 'SparkProcessingJob')
    suppress_nag(stack, 'InteractiveQuery')
    suppress_nag(cicd_stack, 'SparkCICDPipeline')

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'Log Retention is provided by the CDK custom resource provider framework and can\'t be changed' },
            {'id':'AwsSolutions-IAM4', 'reason':'Log Retention is provided by the CDK custom resource provider framework and can\'t be changed' },
        ],
        True
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB1024MiB",
        [
            {'id':'AwsSolutions-L1', 'reason':'The lambda is provided by the Asset L2 construct and can\'t be customized' },
        ]
    )

    template = Template.from_stack(stack)
    results = (stack, template)
    yield results

def test_buckets_found(results):
    results[1].resource_count_is("AWS::S3::Bucket", 8)

def test_e2e_example(results):
    # this method is an example for an E2E test - just include 'e2e' in the test function name
    results[1].resource_count_is("AWS::S3::Bucket", 6)

def test_nag_warnings(results):
    warnings = Annotations.from_stack(results[0]).find_warning('*', Match.string_like_regexp('AwsSolutions-.*'))
    for warning in warnings:
        print(warning)
    assert(len(warnings) == 0)

def test_nag_errors(results):
    errors = Annotations.from_stack(results[0]).find_error('*', Match.string_like_regexp('AwsSolutions-.*'))
    for error in errors:
        print(error)
    assert(len(errors) == 0)