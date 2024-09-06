[//]: # (consumption.redshift-serverless-namespace)
# RedshiftServerlessNamespace

A [Redshift Serverless Namespace](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with secrets manager integration for admin credentials management and rotation.

## Overview

`RedshiftServerlessNamespace` is a [Redshift Serverless Namespace](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with the following options:
- Encrypt data with a customer managed KMS Key.
- Create Redshift superuser credentials managed by Redshift service: stored in Secrets Manager, encrypted with a KMS Key, and with automatic rotation.
- Attach multiple IAM roles that can be used by Redshift Serverless users to interact with other AWS services.
- Set an [IAM role as default](https://docs.aws.amazon.com/redshift/latest/mgmt/default-iam-role.html)

## Usage

[example default usage](./examples/redshift-serverless-namespace-default.lit.ts)

## Attaching IAM Roles to Redshift Serverless Namespace

To allow Redshift Serverless to access other AWS services on your behalf (eg. data ingestion from S3 via the COPY command, accessing data in S3 via Redshift Spectrum, exporting data from Redshift to S3 via the UNLOAD command.), the preferred method is to specify an IAM role. High-level steps are as follows:

1. Create an IAM role with a trust relationship of `redshift.amazonaws.com`.
2. Attach policy/permissions to the role to give it access to specific AWS services.
3. Configure the role when creating the Redshift Serverless Namespace
4. Run the relevant SQL command referencing the attached IAM role via its ARN (or the `default` keyword if a default IAM role is configured)

[example default IAM role configuration](./examples/redshift-serverless-namespace-roles.lit.ts)

[//]: # (consumption.redshift-serverless-workgroup)
# RedshiftServerlessWorkgroup

A [Redshift Serverless Workgroup](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with helpers method for Redshift administration. 

## Overview
`RedshiftServerlessWorkgroup` is a [Redshift Serverless Workgroup](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with the following options/capabilities:
- Deployed in a VPC in private subnets. The network configuation can be customized.
- Provide helper methods for running SQL commands via the Redshift Data API. Commands can be custom or predefined for common administration tasks like creating and granting roles.
- Initialize a Glue Data Catalog integration with auto crawling via Glue Crawlers. This would allow tables in Redshift Serverless to appear in the [Glue Data Catalog](https://docs.aws.amazon.com/glue/latest/dg/catalog-and-crawler.html) for the purposes of discovery and integration.

:::warning
The default VPC created by the construct follows the [standard implementation of the VPC L2 CDK Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#control-over-availability-zones). As a result, if no account ID and no region are configured in the CDK Stack, the VPC will only contain 2 AZ and the [Redshift Serverless Workgroup will fail to deploy](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-usage-considerations.html). Be sure to configure the account ID and region to create a 3 AZ VPC.
:::

## Usage

[example default usage](./examples/redshift-serverless-workgroup-default.lit.ts)

## Bootstrapping Redshift Serverless w/ RedshiftData Construct

The `RedshiftData` construct allows custom SQLs to run against the `RedshiftServerlessWorkgroup` via the Data API. This allows users to bootstrap Redshift directly from CDK.

The `RedshiftData` construct provides the following helpers for bootstrapping Redshift databases:
- Run a custom SQL command
- Create Redshift roles
- Grant Redshift roles full access to schemas
- Grant Redshift roles read only access
- Run a COPY command to load data 

[example bootstrap](./examples/redshift-serverless-workgroup-bootstrap.lit.ts)

## Cataloging Redshift Serverless Tables

Redshift tables and databases can also be automatically catalog in Glue Data Catalog using an helper method. This method creates a Glue Catalog database as well as a crawler to populate the database with table metadata from your Redshift database.

The default value of the path that the crawler would use is `<databaseName>/public/%` which translates to all the tables in the public schema. Please refer to the [crawler documentation](https://docs.aws.amazon.com/glue/latest/dg/define-crawler.html#define-crawler-choose-data-sources) for more information for JDBC data sources.

[example catalog](./examples/redshift-serverless-workgroup-catalog.lit.ts)

[//]: # (consumption.redshift-data-sharing)
# Redshift Data Sharing

The `RedshiftDataSharing` construct allows [Redshift data sharing](https://docs.aws.amazon.com/redshift/latest/dg/datashare-overview.html) management for both producers and consumers.

## Overview

The `RedshiftDataSharing` construct provides the following functionality:

- Create a new data share
- Grants access to the data share to another Redshift namespace or to another AWS account (provides auto data share authorization for cross-account grants)
- Create a database from the data share (and for cross-account grants, auto association of the data share to the consumer's Redshift Namespace)

## Usage

Single account data sharing:
[same account data shares](./examples/redshift-data-sharing-same-account.lit.ts)
Cross-account data sharing:
[cross account data shares](./examples/redshift-data-sharing-cross-account.lit.ts)

[//]: # (consumption.athena-workgroup)
# Athena Workgroup

An [Amazon Athena workgroup](https://docs.aws.amazon.com/athena/latest/ug/manage-queries-control-costs-with-workgroups.html) with provided configuration.

## Overview

`AthenaWorkGroup` provides Athena workgroup configuration with best-practices:
- Amazon S3 bucket for query results, based on [`AnalyticsBucket`](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Storage/analytics-bucket).
- Query results are encrypted using AWS KMS Key.
- Execution Role for the PySpark query engine.
- A grant method to allow principals to run queries.

## Usage

[example default athena usage](./examples/athena-workgroup-default.lit.ts)

## User provided S3 bucket for query results

You can provide your own S3 bucket for query results. If you do so, you are required to provide a KMS Key that will be used to encrypt query results.

:::caution Results encryption
If you provide your own S3 bucket, you also need to provide KMS encryption key to encrypt query results. You also need to 
grant access to this key for AthenaWorkGroup's executionRole (if Spark engine is used), or for principals that were granted to run
queries using AthenaWorkGroup's `grantRunQueries` method.
:::caution

You can also decide to provide your KMS Key to encrypt query results with S3 bucket that is provided by the construct (i.e. if you are not providing your own S3 bucket).

[example usage with user provided bucket](./examples/athena-workgroup-user-bucket.lit.ts)

## Apache Spark (PySpark) Engine version

You can choose Athena query engine from the available options:
- [Athena engine version 3](https://docs.aws.amazon.com/athena/latest/ug/engine-versions-reference-0003.html)
- [PySpark engine version 3](https://docs.aws.amazon.com/athena/latest/ug/notebooks-spark.html)

The `default` is set to `AUTO` which will choose Athena engine version 3. 

If you wish to change query engine to PySpark, you will also be able to access the `executionRole` IAM Role that will be created for you if you don't provide it. 
You can access the execution role via `executionRole` property.

[example usage with pyspark](./examples/athena-workgroup-spark.lit.ts)

## Construct properties

You can leverage different properties to customize your Athena workgroup. For example, you can use `resultsRetentionPeriod` to specify the retention period for your query results. You can provide your KMS Key for encryption even if you use provided results bucket. You can explore other properties available in `AthenaWorkGroupProps`.

[example usage with properties](./examples/athena-workgroup-properties.lit.ts)

## Grant permission to run queries

We provide `grantRunQueries` method to grant permission to principals to run queries using the workgroup.

[example usage with properties](./examples/athena-workgroup-grant.lit.ts)


## Workgroup removal

You can specify if Athena Workgroup construct resources should be deleted when CDK Stack is destroyed using `removalPolicy`. To have an additional layer of protection, we require users to set a global context value for data removal in their CDK applications.

Athena workgroup will be destroyed only if **both** the removal policy parameter of the construct and DSF global removal policy are set to remove objects.

If set to be destroyed, Athena workgroup construct will use `recursiveDeleteOption`, that will delete the workgroup and its contents even if it contains any named queries.

You can set `@data-solutions-framework-on-aws/removeDataOnDestroy` (`true` or `false`) global data removal policy in `cdk.json`:

```json title="cdk.json"
{
  "context": {
    "@data-solutions-framework-on-aws/removeDataOnDestroy": true
  }
}
```
[//]: # (consumption.opensearch)
# OpenSearch

An Amazon OpenSearch Domain with SAML integration and access to OpenSearch REST API. 

## Overview

The `OpenSearchCluster` construct implements an OpenSeach Domain following best practises including:
 * private deployment in VPC
 * SAML-authentication plugin to access OpenSearch Dashboards via a SAML2.0-compatible IdP
 * access to the OpenSeach REST API to interact with OpenSearch objects like Roles, Indexes, Mappings... 
  
By default VPC also creates VPN client endpoint with SAML-authentication to allow secure access to the dashboards. Optionally, you can also provide your own VPC or choose to deploy internet-facing OpenSearch domain by setting `deployInVpc=false` in construct parameters.

SAML-authentication can work with any SAML2.0-compatible provider like Okta. If you use AWS IAM Identity center please check the section below for details. The construct require at least admin role to be provided as parameters. 

For mapping additional IdP roles to OpenSearch dashboard roles, you can use `addRoleMapping` method. 

## Configure IAM Identity center

You need to have IAM Identity center enabled in the same region you plan to deploy your solution. 
To configure SAML integration with OpenSearch you will need to create a custom SAML 2.0 Application and have at least one user group created and attached to the application.
Please follow the [step-by-step guidance](https://aws.amazon.com/blogs/big-data/role-based-access-control-in-amazon-opensearch-service-via-saml-integration-with-aws-iam-identity-center/) to set up IAM Identity center SAML application.

Main steps are:

1. In the region where you deploy OpenSearch, enable IAM Identity Center with AWS Organizations
2. Create a IAM Identity Center group. Use its group ID in the `saml_master_backend_role` parameter of the construct
3. Create a custom application in IAM Identity Center and provide fake URLs as temporary
4. Download the IAM Identity Center SAML metadata file
5. Extract the entityID URL from the metadata file and pass it to `samlEntityId` parameter of the construct
6. Use the content of the metadata file in the `samlMetadataContent` parameter of the construct
7. Provision the construct
8. Update the IAM Identity Center application attribute mappings by adding
   1.  `${user:email}` as the `Subject` with `emailAddress` format. `Subject` is the default subject key used in OpenSearch construct, modify the mapping according to your configuration.
   2.  `${user:groups}`as the `Role` with `unspecified` format. `Role` is the default role key used in OpenSearch construct, modify the mapping according to your configuration.
9. Update the IAM Identity Center application configuration
   1.  Set the `Application ACS URL` to the `OpenSearch SSO URL (IdP initiated)` from the OpenSearch Domain security configuration
   2.  Set the `Application SAML audience` to the `Service provider entity ID` from the OpenSearch Domain security configuration

## Usage

Default configuration 

[example default](examples/opensearch-saml.lit.ts)

Using Client VPN Endpoint 

[example default](examples/opensearch-saml-clientvpn.lit.ts)


[//]: # (consumption.opensearch-api)
# OpenSearch API - Bring you own Opensearch cluster

OpenSearch API client that allows to prepare the data or setup access roles for existing Opensearch clusters. The construct supports both OpenSearch provisioned clusters and OpenSearch Serverless collections.

## Overview

The construct leverages the [CDK Provider Framework](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html#provider-framework) to deploy a custom resource to manage, and provide `addRoleMapping` and `callOpenSearchApi` methods. Both methods return the custom resource so that allows to enforce sequental execution of the API calls. By default all API calls will be executed simultaneously and are independent of each other. 

[example OpenSearch API](examples/opensearch-api.lit.ts)

:::warning

The IAM Role passed as `iamHandlerRole` property has to have all necessary permissions to execute API calls to the cluster. 

:::

## callOpenSearchApi

Generic method to execute any Opensearch API, subject to correct permissions attached to the IAM Role. 

## addRoleMapping

Use this method to add role mappings to OpenSearch cluster using `_security` plugin. 
This method is only applicable to provisioned OpenSearch clusters.

[OpenSearch Roles API](https://opensearch.org/docs/2.13/security/access-control/api#create-role-mapping) does not allow to update individual roles, requiring to pass array of roles that needs to be applied. 
To avoid overwriting prevously added roles `addRoleMapping` method provides `persist` parameter to store previously added roles inside the construct. To avoid racing conditions you also need to execute multiple `addRoleMapping` calls sequentionally as shown below.

```typescript
const firstCall = osApi.addRoleMapping('AnotherAdmin', 'all_access','<IAMRole>', true);
const secondCall = osApi.addRoleMapping('AnotherAdmin', 'all_access','<IAMRole>', true);
secondCall.node.addDependency(firstCall);
```

