import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';
import { Bucket } from "aws-cdk-lib/aws-s3";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

class ExampleRedshiftServerlessWorkgroupBootstrapStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)
    
    const bucket = new Bucket(this, "ExampleDataBucket")
    
    const ingestionRole = new Role(this, "IngestionRole", {
      assumedBy: new ServicePrincipal("redshift.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonRedshiftAllCommandsFullAccess")
      ]
    })
    
    bucket.grantRead(ingestionRole)
    
    const namespace = new dsf.consumption.RedshiftServerlessNamespace(this, 'DefaultRedshiftServerlessNamespace', {
      name: "default",
      dbName: 'defaultdb',
    })
    /// !show
    const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
      name: "default",
      namespace: namespace,
    })

    // Initialize the Redshift Data API
    const dataAccess = workgroup.accessData('DataApi', true)

    // Run a custom SQL to create a customer table
    const createTable = dataAccess.runCustomSQL('CreateCustomerTable', "defaultdb", 
      `
      CREATE TABLE customer(
        customer_id varchar(50), 
        salutation varchar(5), 
        first_name varchar(50), 
        last_name varchar(50), 
        email_address varchar(100)
      ) 
      diststyle even
      `, 
      "drop table customer"
    );

    // Run a COPY command to load data into the customer table
    const ingestion = dataAccess.ingestData('ExampleCopy', "defaultdb", "customer", bucket, "data-products/customer/", "csv ignoreheader 1");

    // Add dependencies between Redshift Data API commands because CDK cannot infer them
    ingestion.node.addDependency(createTable);

    // Create an engineering role in the defaultdb
    const dbRole = dataAccess.createDbRole('EngineeringRole', 'defaultdb', 'engineering');

    // Grant the engineering role full access to the public schema in the defaultdb
    const dbSchema = dataAccess.grantDbSchemaToRole('EngineeringGrant', 'defaultdb', 'public', 'engineering');

    // Enforce dependencies
    dbSchema.node.addDependency(dbRole);
    /// !hide
  }
}

const app = new App()
new ExampleRedshiftServerlessWorkgroupBootstrapStack(app, "ExampleRedshiftServerlessWorkgroupBootstrapStack")