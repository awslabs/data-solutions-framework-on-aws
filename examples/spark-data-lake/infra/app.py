import os
from aws_cdk import App, Environment
from stacks.cicd_stack import CICDPipelineStack

app = App()

cicd_environment = Environment(
    # Configure your environment as needed, see https://docs.aws.amazon.com/cdk/v2/guide/environments.html
    ## region=os.environ["CDK_DEFAULT_REGION"], 
    ## account=os.environ["CDK_DEFAULT_ACCOUNT"]     
)

# Create a CICD Pipeline Stack that will provision an Application stack and a CICD for it
pipeline_stack = CICDPipelineStack(
    app, "CICDPipeline", env=cicd_environment
)

app.synth()
