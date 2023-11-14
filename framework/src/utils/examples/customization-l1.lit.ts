import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { CfnBucket } from "aws-cdk-lib/aws-s3";


class ExampleCustomizationL1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    // Create a data lake using DSF on AWS L3 construct
    const storage = new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage');

    // Access the CDK L1 Bucket construct exposed by the L3 construct
    const cfnBucket = storage.goldBucket.node.defaultChild as CfnBucket;

    // Override the CDK L1 property for transfer acceleration
    cfnBucket.accelerateConfiguration = {
      accelerationStatus: 'Enabled',
    }
    /// !hide
  }
}

const app = new cdk.App();
new ExampleCustomizationL1Stack(app, 'ExampleCustomizationL1Stack');