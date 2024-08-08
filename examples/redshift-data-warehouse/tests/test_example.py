import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template
from cdk_nag import AwsSolutionsChecks
from stacks.main import RedshiftStack

@pytest.fixture(scope='module')
def template():
  app = App()
  stack = RedshiftStack(app, "my-stack-test")
  Aspects.of(stack).add(AwsSolutionsChecks(verbose= True))
  template = Template.from_stack(stack)
  yield template

def test_namespace_exists(template):
  template.resource_count_is("Custom::RedshiftServerlessNamespace", 2)

def test_worksgroup_exists(template):
  template.resource_count_is("AWS::RedshiftServerless::Workgroup", 2)