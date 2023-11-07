import os
from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack

app = App()

cicd_environment = Environment(
    region=os.environ["CDK_DEFAULT_REGION"], # replace this value with your Region, if you don't use a profile
    account=os.environ["CDK_DEFAULT_ACCOUNT"] # replace this value with your Account ID, if you don't use a profile
)

# Create a CICD Pipeline Stack that will provision an Application stack and a CICD for it
pipeline_stack = CICDPipelineStack(
    app, "CICDPipeline", env=cicd_environment
)

app.synth()
