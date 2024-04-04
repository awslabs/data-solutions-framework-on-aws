# Spark Data Lake example 

In this example, we build a Data Lake and process aggregations from the NY taxi dataset with Spark application. This `README` is a step-by-step deployment guide. You can read more details about this example solution in the [documentation](https://awslabs.github.io/data-solutions-framework-on-aws/docs/examples/spark-data-lake)

## Pre-requisite

1. [Install the AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
2. [Bootstrap the CICD account](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap)
3. [Bootstrap the staging and production accounts](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html#cdk-environment-bootstrapping) with a trust relationship from the CICD account

```bash
cdk bootstrap \
--profile <YOUR_AWS_PROFILE> \
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
cdk deploy CICDPipeline
```

1. Add the CICD pipeline Git repository as a remote. The command is provided by the `CICDPipeline` stack as an output. Then push the code to the repository:

```bash
git remote add demo codecommit::<REGION>://SparkTest
git push demo
```

## Cleaning up resources 

1. Delete the `CICDPipeline` stack
   
```
cdk destroy CICDPipeline
```

2. From the console, delete CloudFormation stacks created by the CICD Pipeline 