from cdk_nag import NagSuppressions
from constructs import Construct, Node


def suppress_nag(scope: Construct, construct_id: str):

    return NagSuppressions.add_resource_suppressions(Node.of(scope).find_child(construct_id),[
        {'id':'AwsSolutions-IAM5', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-IAM4', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-L1', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-OS3', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-OS5', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-OS1', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-VPC7', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-SMG4', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-SF1', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-SF2', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-GL1', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-CB3', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-SQS3', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-EKS1', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-KMS5', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-MSK6', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-EC23', 'reason':'Already tested by DSF' },
        {'id':'AwsSolutions-S1', 'reason':'Already tested by DSF' },
        {'id':'CdkNagValidationFailure', 'reason':'Already tested by DSF' },
    ],True)
    
