import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dsf from '../../index';
import { Bucket } from "aws-cdk-lib/aws-s3";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

/// !show
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

        const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "DefaultRedshiftServerlessWorkgroup", {
            workgroupName: "default",
            defaultNamespaceDefaultIAMRole: ingestionRole
        })

        const dataAccess = workgroup.accessData(true)
        const createTable = dataAccess.runCustomSQL("defaultdb", 
                "CREATE TABLE customer(customer_id varchar(50), salutation varchar(5), first_name varchar(50), last_name varchar(50), email_address varchar(100)) diststyle even", "drop table customer"
            )
        const ingestion = dataAccess.ingestData("defaultdb", "customer", bucket, "data-products/customer/", "csv ignoreheader 1")
        ingestion.node.addDependency(createTable)
    }
}
/// !hide

const app = new App()
new ExampleRedshiftServerlessWorkgroupBootstrapStack(app, "ExampleRedshiftServerlessWorkgroupBootstrapStack")