# Spark Data Lake example 

In this example, we build a Data Lake and process aggregations from the NY taxi dataset with Spark application. This `README` is a step-by-step deployment guide. You can read more details about this example solution in the [documentation](https://awslabs.github.io/data-solutions-framework-on-aws/)

We are using a self-contained application where developers can manage both business code (Spark code in `./spark` folder), and the infrastructure code (AWS CDK code in `./infra` folder).

The business code is a simple **PySpark** application packaged in a common Python project following the [best practices](https://packaging.python.org/en/latest/tutorials/packaging-projects/):
 * A `pyproject.toml` file is used to install internal (packages defined in the code structure) and external dependencies (libraries from PyPi).
 * An `src` folder containing business code organized in Python packages (`__init__.py` files).
 * A `test` folder containing the unit tests run via `pytest .` command from the root folder of the Spark project. You can use the [EMR Vscode toolkit](https://marketplace.visualstudio.com/items?itemName=AmazonEMR.emr-tools) to locally test the application on an EMR local runtime.

The infrastructure code is an AWS CDK application using the DSF on AWS library to create the required resources. It contains 2 CDK stacks:
 * An **application stack** which provisions the Data Lake, data catalog, and the Spark runtime resources via the following constructs:
   * A `DataLakeStorage` 
   * A `DataCatalogDatatabse`
   * A `SparkEmrServerlessRuntime`
   * A `SparkEmrServerlessJob`
 * A **CICD stack** which provisions a CICD Pipeline to manage the application development lifecycle via the following constructs:
   * A `SparkEmrCICDPipeline`
   * A `ApplicationStackFactory`

## Pre-requisite

1. [Install the AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
2. [Bootstrap the CICD account](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap)
3. [Bootstrap the staging and production accounts](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html#cdk-environment-bootstrapping) with a trust relationship from the CICD account

```bash
cdk bootstrap \
--profile staging \
--trust <CICD_ACCOUNT_ID> \
--cloudformation-execution-policies “POLICY_ARN” \
aws://<STAGING_ACCOUNT_ID>/<REGION>
```
4. [Install the git-remote-codecommit](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-git-remote-codecommit.html#setting-up-git-remote-codecommit-install) utility to interact with AWS CodeCommit

## Getting started

1. Copy the `spark-data-lake` folder somewhere else on your machine and initialize a new git repository:

```bash
cp -R ../spark-data-lake <MY_LOCAL_PATH>
cd <MY_LOCAL_PATH>
git init
```

2. Modify the `./infra/requirements.txt` to add the `cdklabs.aws_data_solutions_framework` library as a dependency:

```
aws-cdk-lib==2.94.0
constructs>=10.2.55, <11.0.0
cdklabs.aws_data_solutions_framework
```

2. From the `./infra` folder, create Python3 virtual environment and activate it:

```bash
cd infra
python3 -m venv .venv 
source .venv/bin/activate 
```

3. Install the DSF on AWS library:

```bash
pip install -r requirements.txt 
```

4. Provide the target accounts and region information for the staging and production steps of the CICD pipeline. 
   Also configure the global removal policy if you want to delete all the resources including the data when deleting the example.


   Create a `cdk.context.json` file with the following content:

```json
{
  "staging": {
    "account": "<STAGING_ACCOUNT_ID>",
    "region": "<STAGING_REGION>"
  },
  "prod": {
    "account": "<PRODUCTION_ACCOUNT_ID>",
    "region": "<PRODUCTION_REGION>"
  },
  "@data-solutions-framework-on-aws/removeDataOnDestroy": true
}
```

1. Deploy the CICD pipeline stack:

```
cdk deploy CICDPipelineStack
```

1. Add the CICD pipeline Git repository as a remote. The command is provided by the `CICDPipelineStack` as an output. Then push the code to the repository:

```bash
git remote add demo codecommit::<REGION>://SparkTest
git push demo
```