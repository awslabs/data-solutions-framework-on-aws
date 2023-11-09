import * as cdk from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleAnalyticsBucketNamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const key = new Key(this, 'DataKey', {
      enableKeyRotation: true,
    });

/// !show
    new dsf.storage.AnalyticsBucket(this, 'AnalyticsBucket', {
        bucketName: dsf.utils.BucketUtils.generateUniqueBucketName(this, 'AnalyticsBucket', 'my-custom-name'),
        encryptionKey: key
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleAnalyticsBucketNamingStack(app, 'ExampleAnalyticsBucketNamingStack');