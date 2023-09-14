import os
from aws_cdk import App, Environment
from adsf_example.main import MyStack

# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
MyStack(app, "example-dev", env=dev_env)
# MyStack(app, "example-prod", env=prod_env)

app.synth()