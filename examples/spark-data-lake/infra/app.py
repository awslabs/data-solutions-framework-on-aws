import os

from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack

# For development, use account/region from cdk cli
dev_env = Environment(
    account=os.getenv("CDK_DEFAULT_ACCOUNT"), region=os.getenv("CDK_DEFAULT_REGION")
)
app = App()
# Create a CICD Pipeline Stack that will provision an Application stack and a CICD for it
pipeline_stack = CICDPipelineStack(
    app, "CICDPipeline", env=Environment(region="eu-west-1")
)

app.synth()
