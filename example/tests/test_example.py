import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from adsf_example.main import MyStack

@pytest.fixture(scope='module', )
def template():
  app = App()
  stack = MyStack(app, "my-stack-test")
  template = Template.from_stack(stack)
  yield template

def test_no_buckets_found(template):
  template.resource_count_is("AWS::S3::Bucket", 0)

def test_e2e_example(template):
  # this method is an example for an E2E test - just include 'e2e' in the test function name
  template.resource_count_is("AWS::S3::Bucket", 0)
