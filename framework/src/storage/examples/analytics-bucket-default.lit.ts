import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Key } from "aws-cdk-lib/aws-kms";

/// !show
class ExampleDefaultAnalyticsBucketStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const key = new Key(this, 'DataKey', {
            enableKeyRotation: true
        });

        new dsf.storage.AnalyticsBucket(this, 'AnalyticsBucket', {
            encryptionKey: key
        });
    }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultAnalyticsBucketStack(app, 'ExampleDefaultDataLakeStorage');