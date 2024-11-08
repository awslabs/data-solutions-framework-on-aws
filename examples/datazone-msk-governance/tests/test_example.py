# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template, Annotations, Match
from cdk_nag import NagSuppressions, AwsSolutionsChecks
from constructs import Construct, Node
from stacks.main import StreamingGovernanceStack
from tests.nag_suppressions import suppress_nag

@pytest.fixture(scope='module')
def results():
    app = App()
    stack = StreamingGovernanceStack(app, "my-stack-test", domain_id='2222222', datazone_portal_role_name='1111111')
    Aspects.of(stack).add(AwsSolutionsChecks(verbose=True))

    # We suppress NAGs for the DSF construct because they are already tested in the framework
    suppress_nag(stack, 'DataZoneMskAssetType')
    suppress_nag(stack, 'CentralAuthorizer')
    suppress_nag(stack, 'EnvironmentAuthorizer')
    suppress_nag(stack, 'ProducerGsrDataSource')
    suppress_nag(stack, 'MskServerless')


    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'Wildcard used in Log Retention policy is setup by the CDK framework and can\'t be changed' },
        ]
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource",
        [
            {'id':'AwsSolutions-IAM4', 'reason':'Managed Policy for Log Retention role is setup by the CDK framework and can\'t be changed' },
        ]
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/AWS679f53fac002430cb0da5b7982bd2287",
        [
            {'id':'AwsSolutions-IAM4', 'reason':'Managed Policy for Custom Resource provider framework role is setup by the CDK framework and can\'t be changed' },
            {'id':'AwsSolutions-L1', 'reason':'Lambda Function for Custom Resource provider framework is setup by the CDK framework and can\'t be changed' },
        ],
        True,
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/ProducerRole",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'Wildcards are required for ENI and Glue Schema which can\'t be scoped down (not predictable or listing all resources required)' },
        ],
        True
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/ConsumerRole",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'Wildcards are required for ENI and Glue Schema which can\'t be scoped down (not predictable or listing all resources required)' },
        ],
        True,
    )

    template = Template.from_stack(stack)
    results = (stack, template)
    yield results


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
