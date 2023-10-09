import os
from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack 
from stacks.application_stack import ApplicationStack


# for development, use account/region from cdk cli
dev_env = Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

app = App()
pipeline_stack = CICDPipelineStack(app, "CICDPipelineStack", env=dev_env)

ApplicationStack(app, 'EmrApplicationStack')
app.synth()