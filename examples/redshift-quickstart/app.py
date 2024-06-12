import os
from aws_cdk import App, Environment
from stacks.main import RedshiftStack

# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
RedshiftStack(app, "redshift-quickstart-dev", env=dev_env)

app.synth()