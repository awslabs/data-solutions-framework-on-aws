import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Key } from "aws-cdk-lib/aws-kms";


class ExampleAnalyticsBucketObjectRemovalStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    // Set context value for global data removal policy
    this.node.setContext('@aws-data-solutions-framework/removeDataOnDestroy', true);
    /// !hide

    /// You will also need to set removal policy
    /// !show
    const key = new Key(this, 'DataKey', {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY
    });

    new dsf.storage.AnalyticsBucket(this, 'AnalyticsBucket', {
        encryptionKey: key,
        removalPolicy: RemovalPolicy.DESTROY
    });
    /// !hide
  }
}

const app = new cdk.App();
new ExampleAnalyticsBucketObjectRemovalStack(app, 'ExampleAnalyticsBucketObjectRemovalStack');