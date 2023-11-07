import os
from aws_cdk import App, Environment
from stacks.main import DataStack

# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
DataStack(app, "adsf-quickstart-dev", env=dev_env)
# MyStack(app, "adsf-quickstart-prod", env=prod_env)

app.synth()