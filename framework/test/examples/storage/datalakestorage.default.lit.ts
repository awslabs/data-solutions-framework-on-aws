/// !show
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../../src';

export class ExampleDefaultDataLakeStorage extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new Bucket();
    new dsf.DataLakeStorage(this, 'MyDataLakeStorage');
  }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultDataLakeStorage(app, 'ExampleDefaultDataLakeStorage');