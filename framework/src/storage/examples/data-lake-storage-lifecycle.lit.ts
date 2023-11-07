import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleDefaultDataLakeStorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
/// !show
    new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage', {
        bronzeBucketInfrequentAccessDelay: 90,
        bronzeBucketArchiveDelay: 180,
        silverBucketInfrequentAccessDelay: 180,
        silverBucketArchiveDelay: 360,
        goldBucketInfrequentAccessDelay: 180,
        goldBucketArchiveDelay: 360,
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleDefaultDataLakeStorageStack(app, 'ExampleDefaultDataLakeStorage');