# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template, Annotations, Match
from cdk_nag import NagSuppressions, AwsSolutionsChecks
from constructs import Construct, Node
from tests.nag_suppressions import suppress_nag

from stacks.main import OpenSearchStack

@pytest.fixture(scope='module')
def results():
    app = App()
    stack = OpenSearchStack(app, "my-stack-test")
    Aspects.of(stack).add(AwsSolutionsChecks(verbose=True))

    # We suppress NAGs for the DSF construct because they are already tested in the framework
    suppress_nag(stack, 'MyOpenSearchCluster')

    # NagSuppressions.add_resource_suppressions_by_path(stack,
    #     "/my-stack-test/S3ReadPolicy/Resource",
    #     "/my-stack-test/AWS679f53fac002430cb0da5b7982bd2287/Resource",
    #     "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource",
    #     "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource",
    #     "/my-stack-test/CreateSLR/Provider/CustomResourceProvider/framework-onEvent/Resource",
    #     "/my-stack-test/CreateSLR/Provider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource",
    #     "/my-stack-test/CreateSLR/Provider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource",
    #     "/my-stack-test/MyOpenSearchCluster/Domain/Resource",
    #     [
    #         {'id':'AwsSolutions-IAM5', 'reason':'The read policy needs to contain resource wildcard to target data files in the bucket' },
    #     ]
    # )

    template = Template.from_stack(stack)
    results = (stack, template)
    yield results

def test_domain_exists(results):
    results[1].resource_count_is("AWS::OpenSearchService::Domain", 1)

def test_e2e_domain_exists(results):
    results[1].resource_count_is("AWS::OpenSearchService::Domain", 1)

def test_nag_warnings(results):
    warnings = Annotations.from_stack(results[0]).find_warning('*', Match.string_like_regexp('AwsSolutions-.*'))
    print(warnings)
    assert(len(warnings) == 0)

def test_nag_errors(results):
    errors = Annotations.from_stack(results[0]).find_error('*', Match.string_like_regexp('AwsSolutions-.*'))
    print(errors)
    assert(len(errors) == 0)