# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from stacks.main import OpenSearchStack

@pytest.fixture(scope='module')
def template():
  app = App()
  stack = OpenSearchStack(app, "my-stack-test")
  template = Template.from_stack(stack)
  yield template


def test_buckets_found(template):
    template.resource_count_is("AWS::OpenSearchService::Domain", 1)

def test_e2e_quickstart(template):
    template.resource_count_is("AWS::OpenSearchService::Domain", 1)
