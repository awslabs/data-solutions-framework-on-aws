import os
from aws_cdk import App, Environment
from adsf_example.main import ExampleStack

# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
ExampleStack(app, "ExampleStack", env=dev_env)

app.synth()