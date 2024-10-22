from cdk_nag import NagSuppressions
from constructs import Construct, Node


def suppress_nag(scope: Construct, construct_id: str):

    return NagSuppressions.add_resource_suppressions(Node.of(scope).find_child(construct_id),[
        {'id':'AwsSolutions-IAM5', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-IAM4', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-L1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-OS3', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-OS5', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-OS1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-VPC7', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-SMG4', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-SF1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-SF2', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-GL1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-CB3', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-SQS3', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-EKS1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-KMS5', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-MSK6', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-EC23', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-S1', 'reason':'Inherited from DSF, suppressed in DSF Nag tests' },
        {'id':'AwsSolutions-S2', 'reason':'This bucket is publicly available because it hosts test data for other workshops.' },
        {'id':'CdkNagValidationFailure', 'reason':'Tokens are used to resolve CIDR at deploy time' },
    ],True)
    
