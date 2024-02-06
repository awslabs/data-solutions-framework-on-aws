import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';

/// !show
class ExampleDefaultRedshiftServerlessWorkgroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)
    
    const namespace = new dsf.consumption.RedshiftServerlessNamespace(this, 'DefaultRedshiftServerlessNamespace', {
      name: "default",
      dbName: 'defaultdb',
    })
    
    new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
      name: "default",
      namespace: namespace,
    })
  }
}
/// !hide
const app = new App()
new ExampleDefaultRedshiftServerlessWorkgroupStack(app, "ExampleDefaultRedshiftServerlessWorkgroupStack")