import os
from aws_cdk import Stack
from constructs import Construct
from aws_dsf import ApplicationStackFactory, CICDStage

class EmrApplicationStackFactory(ApplicationStackFactory):
    def __init__(self) -> None:
        super().__init__()

    def create_stack(self, scope: Construct, stage: CICDStage) -> Stack:
        return None


class MyStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # The code that defines your stack goes here
