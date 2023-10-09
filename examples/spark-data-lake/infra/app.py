from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack

app = App()

cicd_enviroment = Environment(
    region="REGION",
    account="ACCOUNT-ID"
)

# Create a CICD Pipeline Stack that will provision an Application stack and a CICD for it
pipeline_stack = CICDPipelineStack(
    app, "CICDPipeline", env=cicd_enviroment
)

app.synth()
