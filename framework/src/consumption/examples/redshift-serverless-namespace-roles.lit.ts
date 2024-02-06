import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';
import { Bucket } from "aws-cdk-lib/aws-s3";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

/// !show
class ExampleRedshiftServerlessNamespaceRolesStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)
    
    const bucket = new Bucket(this, "ExampleBucket")
    
    const ingestionRole = new Role(this, "IngestionRole", {
      assumedBy: new ServicePrincipal("redshift.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonRedshiftAllCommandsFullAccess")
      ]
    })
    
    bucket.grantRead(ingestionRole)
    
    new dsf.consumption.RedshiftServerlessNamespace(this, "RedshiftServerlessNamespace", {
      dbName: "database",
      name: "example-namespace",
      defaultIAMRole: ingestionRole 
    })
  }
}
/// !hide
const app = new App()
new ExampleRedshiftServerlessNamespaceRolesStack(app, "ExampleRedshiftServerlessNamespaceRolesStack")