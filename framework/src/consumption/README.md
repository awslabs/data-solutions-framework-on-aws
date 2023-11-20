[//]: # (consumption.redshift-serverless-namespace)
# RedshiftServerlessNamespace

A [Redshift Serverless Namespace](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with secrets manager integration for admin credentials management and rotation.

## Overview

`RedshiftServerlessNamespace` is a [Redshift Serverless Namespace](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with the following options:
- Attach multiple IAM roles that can be used by Redshift Serverless users to interact with other AWS services.
- Set an [IAM role as default](https://docs.aws.amazon.com/redshift/latest/mgmt/default-iam-role.html)
- Provide a CMK or let the construct create a new KMS Key. This key would be used to encrypt the namespace data as well as the associated admin credential secrets

## Usage

[example default usage](./examples/redshift-serverless-namespace-default.lit.ts)

## Attaching IAM Roles to Redshift Serverless Namespace

To allow Redshift Serverless to access other AWS services on your behalf (eg. data ingestion from S3 via the COPY command, accessing data in S3 via Redshift Spectrum, exporting data from Redshift to S3 via the UNLOAD command.), the preferred method is to specify an IAM role. High-level steps are as follows:

1. Create an IAM role with a trust relationship of `redshift.amazonaws.com`.
2. Attach policy/permissions to the role to give it access to specific AWS services.
3. Attach the role to the Redshift Serverless Namespace
4. Run the relevant command referencing the attached IAM role via its ARN (or the `default` keyword if a default IAM role is configured)

[example default IAM role configuration](./examples/redshift-serverless-namespace-roles.lit.ts)

[//]: # (consumption.redshift-serverless-workgroup)
# RedshiftServerlessWorkgroup

A [Redshift Serverless Workgroup](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with auto creation of Namespace and VPC. 

## Overview
`RedshiftServerlessWorkgroup` is a [Redshift Serverless Workgroup](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-workgroup-namespace.html) with the following options/capabilities:
- Custom resource to allow data access, data initialization, and bootstrapping of the database.
- Initialize data catalog integration with auto crawling. This would allow tables in Redshift Serverless to appear in the [Glue Data Catalog](https://docs.aws.amazon.com/glue/latest/dg/catalog-and-crawler.html) for the purposes of discovery and integration.

## Usage

[example default usage](./examples/redshift-serverless-workgroup-default.lit.ts)

## Bootstrapping Redshift Serverless w/ RedshiftData Construct

The `RedshiftData` construct allows custom SQLs to run against the `RedshiftServerlessWorkgroup` via the Data API. This allows users to bootstrap Redshift directly from CDK.

[example bootstrap](./examples/redshift-serverless-workgroup-bootstrap.lit.ts)

## Cataloging Redshift Serverless Tables

To catalog the tables in your Redshift Serverless Workgroup, the following example creates a Glue Catalog database as well as a crawler to populate the database with table metadata from your Redshift Serverless Workgroup.

The default value of the path that the crawler would use is `<databaseName>/public/%` which translates to all the table in the public schema. Please refer to the [crawler documentation](https://docs.aws.amazon.com/glue/latest/dg/define-crawler.html#define-crawler-choose-data-sources) for more information for JDBC data sources.

[example catalog](./examples/redshift-serverless-workgroup-catalog.lit.ts)