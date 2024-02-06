import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';

/// !show
class ExampleRedshiftServerlessWorkgroupCatalogStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)
    
    const namespace = new dsf.consumption.RedshiftServerlessNamespace(this, 'DefaultRedshiftServerlessNamespace', {
      name: "default",
      dbName: 'defaultdb',
    })
    
    const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
      name: "default",
      namespace: namespace,
    })
    
    workgroup.catalogTables('RedshiftCatalog', "example-redshift-db", 'defaultdb/public/%')
  }
}
/// !hide
const app = new App()
new ExampleRedshiftServerlessWorkgroupCatalogStack(app, "ExampleRedshiftServerlessWorkgroupCatalogStack")