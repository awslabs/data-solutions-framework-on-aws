import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';

/// !show
class ExampleDefaultRedshiftServerlessWorkgroupStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)
        new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
            workgroupName: "default"
        })
    }
}
/// !hide

const app = new App()
new ExampleDefaultRedshiftServerlessWorkgroupStack(app, "ExampleDefaultRedshiftServerlessWorkgroupStack")