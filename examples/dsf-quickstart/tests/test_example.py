# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template, Annotations, Match
from cdk_nag import NagSuppressions, AwsSolutionsChecks
from constructs import Construct, Node
from tests.nag_suppressions import suppress_nag

from stacks.main import DataStack

@pytest.fixture(scope='module')
def results():
    app = App()
    stack = DataStack(app, "my-stack-test")
    Aspects.of(stack).add(AwsSolutionsChecks(verbose=True))

    # We suppress NAGs for the DSF construct because they are already tested in the framework
    suppress_nag(stack, 'DataLakeStorage')
    suppress_nag(stack, 'SparkProcessingRuntime')
    suppress_nag(stack, 'ProcessingExecRole')

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/S3ReadPolicy/Resource",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'The read policy needs to contain resource wildcard to target data files in the bucket' },
        ]
    )

    template = Template.from_stack(stack)
    results = (stack, template)
    yield results


def test_buckets_found(results):
    results[1].resource_count_is("AWS::S3::Bucket", 1)
    results[1].resource_count_is("AWS::EMRServerless::Application", 1)

def test_e2e_quickstart(results):
    results[1].resource_count_is("AWS::S3::Bucket", 1)
    results[1].resource_count_is("AWS::EMRServerless::Application", 1)

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