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

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/MyOpenSearchCluster/Domain/Resource",
        [
            {'id':'AwsSolutions-OS4', 'reason':'Domain is created with single AZ and no zone-awareness to optimize costs' },
            {'id':'AwsSolutions-OS7', 'reason':'Domain is created without dedicated master nodes to optimize costs' },
        ]
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'Resource wildcard for Log Retention permission is setup by the CDK custom resource provider framework and can\'t be changed' },
            {'id':'AwsSolutions-IAM4', 'reason':'Managed Policy for Log Retention is setup by the CDK custom resource provider framework and can\'t be changed' },
        ],
        True
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/AWS679f53fac002430cb0da5b7982bd2287",
        [
            {'id':'AwsSolutions-IAM4', 'reason':'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed' },
            {'id':'AwsSolutions-L1', 'reason': 'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed'}
        ],
        True,
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/OpenSearchApi/Provider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource",
        [
            {'id':'AwsSolutions-IAM4', 'reason':'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed' },
            {'id':'AwsSolutions-L1', 'reason': 'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed'}
        ],
        True,
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/OpenSearchApi/Provider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource",
        [
            {'id':'AwsSolutions-IAM5', 'reason':'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed' },
            {'id':'AwsSolutions-L1', 'reason': 'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed'}
        ],
        True,
    )

    NagSuppressions.add_resource_suppressions_by_path(stack,
        "/my-stack-test/OpenSearchApi/Provider/CustomResourceProvider/framework-onEvent/Resource",
        [
            {'id':'AwsSolutions-L1', 'reason': 'The Lambda is part of the CDK custom resource framework for SDK calls and can\'t be changed'}
        ],
        True,
    )
    


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