import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from stacks.main import MyStack

@pytest.fixture(scope='module')
def template():
  app = App()
  stack = MyStack(app, "my-stack-test")
  template = Template.from_stack(stack)
  yield template

def test_no_buckets_found(template):
  template.resource_count_is("AWS::S3::Bucket", 0)
