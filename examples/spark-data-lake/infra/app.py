import os
from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack 

# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
pipeline_stack = CICDPipelineStack(app, "ExampleStack", env=Environment(region='eu-west-1'))

app.synth()