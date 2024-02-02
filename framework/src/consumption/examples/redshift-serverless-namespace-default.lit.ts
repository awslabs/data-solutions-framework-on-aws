import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';

/// !show
class ExampleDefaultRedshiftServerlessNamespaceStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)
        new dsf.consumption.RedshiftServerlessNamespace(this, "RedshiftServerlessNamespace", {
            dbName: "database",
            name: "example-namespace"  
        })
    }
}
/// !hide
const app = new App()
new ExampleDefaultRedshiftServerlessNamespaceStack(app, "ExampleDefaultRedshiftServerlessNamespaceStack")