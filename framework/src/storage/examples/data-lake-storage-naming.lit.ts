import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { BucketUtils } from "../../index";

class ExampleDataLakeStorageNamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
/// !show
    new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage', {
        bronzeBucketName: BucketUtils.generateUniqueBucketName(this, 'MyDataLakeStorage', 'custom-bronze-name')
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleDataLakeStorageNamingStack(app, 'ExampleDataLakeStorageNamingStack');