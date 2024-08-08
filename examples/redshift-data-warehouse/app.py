import os
from aws_cdk import App, Environment, Aspects
from stacks.main import RedshiftStack
from cdk_nag import AwsSolutionsChecks


# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
Aspects.of(app).add(AwsSolutionsChecks(verbose= True))
RedshiftStack(app, "RedshiftDataWarehouseExample", env=dev_env)

app.synth()