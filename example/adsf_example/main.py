from aws_cdk import Stack, RemovalPolicy, Duration, CustomResource
from aws_cdk.aws_iam import *
from aws_cdk.aws_lambda import *
from aws_cdk.custom_resources import *
from constructs import Construct
from adsf import DataLakeStorage

class ExampleStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    sample_data_bucket_name = "nyc-tlc"
    sample_data_bucket_prefix = "trip data/"

    storage = DataLakeStorage(self, "DataLakeStorage", removal_policy=RemovalPolicy.DESTROY)

    copy_sample_role = Role(
      self, 
      "CopySampleRole", 
      assumed_by=ServicePrincipal("lambda.amazonaws.com"),
      inline_policies={
        "AllowLogging": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              resources=["*"]
            )
          ]
        ),
        "AllowS3": PolicyDocument(
          statements=[
            PolicyStatement(
              effect=Effect.ALLOW,
              actions=[
                "s3:*"
              ],
              resources=["*"]
            )
          ]
        )
      }
    )

    storage.bronze_bucket.grant_read_write(copy_sample_role)

    copy_sample_function = Function(
      self, 
      "CopySampleFunction",
      runtime=Runtime.NODEJS_18_X,
      role=copy_sample_role,
      code=Code.from_asset("./adsf_example/copy_sample_function/"),
      handler="index.handler",
      timeout=Duration.minutes(10),
      environment={
        "SOURCE_BUCKET_NAME": sample_data_bucket_name,
        "SOURCE_BUCKET_PREFIX": sample_data_bucket_prefix,
        "SOURCE_BUCKET_REGION": "us-east-1",
        "TARGET_BUCKET_NAME": storage.bronze_bucket.bucket_name,
        "TARGET_BUCKET_PREFIX": "nyc-taxi/"
      }
    )

    copy_provider = Provider(self, "CopyProvider", on_event_handler=copy_sample_function)

    CustomResource(self, "CopyCustomResource", service_token=copy_provider.service_token)

    
