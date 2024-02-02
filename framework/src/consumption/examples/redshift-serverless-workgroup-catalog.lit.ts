import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';

/// !show
class ExampleRedshiftServerlessWorkgroupCatalogStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)
        const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
            workgroupName: "default"
        })

        workgroup.catalogTables("example-redshift-db")
    }
}
/// !hide
const app = new App()
new ExampleRedshiftServerlessWorkgroupCatalogStack(app, "ExampleRedshiftServerlessWorkgroupCatalogStack")