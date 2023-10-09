from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack

app = App()
# Create a CICD Pipeline Stack that will provision an Application stack and a CICD for it
pipeline_stack = CICDPipelineStack(
    app, "CICDPipeline", env=Environment(region="eu-west-1")
)

app.synth()
