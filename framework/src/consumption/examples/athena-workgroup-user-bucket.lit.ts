import { App, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms'
import * as dsf from '../../index';

class ExampleUserBucketAthenaWorkGroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const userResultsBucket = new Bucket(this, 'UserResultsBUcket')
    const userDataKey = new Key(this, 'userDataKey')

    /// !show
    new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupDefault', {
      name: 'athena-user-bucket',
      resultBucket: userResultsBucket,
      resultsEncryptionKey: userDataKey,
      resultLocationPrefix: 'athena-wg-results/'
    })
    /// !hide
  }
}
const app = new App()
new ExampleUserBucketAthenaWorkGroupStack(app, 'ExampleUserBucketAthenaWorkGroupStack')