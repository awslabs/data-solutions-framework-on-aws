import * as dsf from 'aws-dsf';
import { Construct } from 'constructs';

/**
 * @exampleMetadata nofixture
 * @example
 * import { Construct } from 'constructs';
 * import * as cdk from 'aws-cdk-lib';
 * import * as dsf from 'aws-dsf';
 *
 * class MyStack extends cdk.Stack {
 *   constructor(scope: Construct, id: string) {
 *     super(scope, id);
 *
 *     new dsf.DataLakeStorage(this, 'MyDataLakeStorage');
 *   }
 * }
 */
export class DataLakeStorageSmartDefault extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new dsf.DataLakeStorage(this, 'MyDataLakeStorage');
  }
}

/**
 * @example
 * new dsf.DataLakeStorage(this, 'MyDataLakeStorage', {
 *   bronzeBucketName: dsf.BucketUtils.generateUniqueBucketName(this, 'MyDataLakeStorage', 'my-custom-bronze')
 * });
 */
export class DataLakeStorageBucketNaming {
}