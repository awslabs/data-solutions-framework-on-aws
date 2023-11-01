import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { BucketUtils } from "../../index";

class ExampleAccessLogsBucketNamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
/// !show
    new dsf.storage.AccessLogsBucket(this, 'MyAccessLogs', {
        bucketName: BucketUtils.generateUniqueBucketName(this, 'MyAccessLogs', 'my-custom-name')
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleAccessLogsBucketNamingStack(app, 'ExampleAccessLogsBucketNaming');