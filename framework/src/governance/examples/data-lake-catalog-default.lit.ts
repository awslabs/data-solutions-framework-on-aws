import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleDefaultDataLakeCatalogStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const storage = new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage');

        new dsf.governance.DataLakeCatalog(this, 'DataCatalog', {
            dataLakeStorage: storage,
        });
    }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultDataLakeCatalogStack(app, 'ExampleDefaultDataLakeCatalogStack');