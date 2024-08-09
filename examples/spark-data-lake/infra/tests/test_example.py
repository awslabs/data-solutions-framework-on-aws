# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template, Annotations, Match
from cdk_nag import AwsSolutionsChecks
from stacks.application_stack import ApplicationStack


@pytest.fixture(scope="module")
def results():
    app = App()
    stack = ApplicationStack(app, "my-stack-test")
    Aspects.of(stack).add(AwsSolutionsChecks())
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
    print(warnings)
    assert(len(warnings) == 0)

def test_nag_errors(results):
    errors = Annotations.from_stack(results[0]).find_error('*', Match.string_like_regexp('AwsSolutions-.*'))
    print(errors)
    assert(len(errors) == 0)