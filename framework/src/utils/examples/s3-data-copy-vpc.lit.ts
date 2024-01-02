import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';


class ExampleVpcS3DataCopyStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const sourceBucket = Bucket.fromBucketName(this, 'sourceBucket', 'nyc-tlc');
    const targetBucket = Bucket.fromBucketName(this, 'destinationBucket', 'staging-bucket');
    
    /// !show
    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcName: 'my-vpc'});
    const subnets = vpc.selectSubnets({subnetType: SubnetType.PRIVATE_WITH_EGRESS});
    
    new dsf.utils.S3DataCopy(this, 'S3DataCopy', {
      sourceBucket,
      sourceBucketPrefix: 'trip data/',
      sourceBucketRegion: 'us-east-1',
      targetBucket,
      targetBucketPrefix: 'staging-data/',
      vpc,
      subnets,
    });
    /// !hide
  }
}


const app = new cdk.App();
new ExampleVpcS3DataCopyStack(app, 'ExampleVpcS3DataCopy');