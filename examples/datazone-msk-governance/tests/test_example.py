import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from stacks.central_stack import CentralStack

@pytest.fixture(scope='module')
def template():
  app = App()
  stack = CentralStack(app, "CentralStackTest")
  template = Template.from_stack(stack)
  yield template

def fake_test(template):
  assert(True)
