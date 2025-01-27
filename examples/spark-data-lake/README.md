# Spark Data Lake example 

In this example, we build a Data Lake and process aggregations from the NY taxi dataset with Spark application. This `README` is a step-by-step deployment guide. You can read more details about this example solution in the [documentation](https://awslabs.github.io/data-solutions-framework-on-aws/docs/examples/spark-data-lake)

## Pre-requisite

1. Docker
2. [Install the AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
3. [Bootstrap the CICD account](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap)
4. [Bootstrap the staging and production accounts](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html#cdk-environment-bootstrapping) with a trust relationship from the CICD account

```bash
cdk bootstrap \
--profile <YOUR_AWS_PROFILE> \
--trust <CICD_ACCOUNT_ID> \
--cloudformation-execution-policies “POLICY_ARN” \
aws://<STAGING_ACCOUNT_ID>/<REGION>
```
4. [Install the git-remote-codecommit](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-git-remote-codecommit.html#setting-up-git-remote-codecommit-install) utility to interact with AWS CodeCommit

## Getting started

1. Download the Spark Data Lake example from the Data Solutions Framework on AWS Github and unzip it:

```bash
curl -LJO https://github.com/awslabs/data-solutions-framework-on-aws/releases/latest/download/spark-data-lake-example.zip
unzip spark-data-lake-example.zip -d spark-data-lake-example
cd spark-data-lake-example
```

2. Modify the `./requirements.txt` to add the `cdklabs.aws_data_solutions_framework` library as a dependency:

```
aws-cdk-lib
constructs>=10.3.0, <11.0.0
cdklabs.aws_data_solutions_framework
```

1. From the `./infra` folder, create Python3 virtual environment and activate it:

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

Alternatively, if further customization is necessary, the following allows multiple different environments to be created:

```json
{
  "environments": [
    {
      "stageName": "<STAGE_NAME_1>",
      "account": "<STAGE_ACCOUNT_ID>",
      "region": "<REGION>",
      "triggerIntegTest": "<OPTIONAL_BOOLEAN_CAN_BE_OMMITTED>"
    },
    {
      "stageName": "<STAGE_NAME_2>",
      "account": "<STAGE_ACCOUNT_ID>",
      "region": "<REGION>",
      "triggerIntegTest": "<OPTIONAL_BOOLEAN_CAN_BE_OMMITTED>"
    },
    {
      "stageName": "<STAGE_NAME_3>",
      "account": "<STAGE_ACCOUNT_ID>",
      "region": "<REGION>",
      "triggerIntegTest": "<OPTIONAL_BOOLEAN_CAN_BE_OMMITTED>"
    }
  ]
}
```

5. Create a connection, this will server to link your code repository to Amazon Code Pipeline. You can follow the instruction in the [AWS documentation](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections.html)
to create a connection.

6. Once you create the connection, get its ARN and update the code in `infra/stacks/cicd_stack.py`. Make sure to also update the repository and the branch. The snippet below shows the code you need to update.

```python
    source= CodePipelineSource.connection("your/repo", "branch",
              connection_arn="arn:aws:codestar-connections:us-east-1:222222222222:connection/7d2469ff-514a-4e4f-9003-5ca4a43cdc41"
            ),
```

7. Uncomment these 2 lines in the `infra/app.py` file:

```python
    # region=os.environ["CDK_DEFAULT_REGION"],
    # account=os.environ["CDK_DEFAULT_ACCOUNT"]
```
   
8. Set the environment variables for cross account deployments

```bash
export CDK_DEFAULT_REGION=<DEV_REGION>
export CDK_DEFAULT_ACCOUNT=<DEV_ACCOUNT_ID> 
```

9. Deploy the CICD pipeline stack:

```
cdk deploy CICDPipeline
```

10. Add the CICD pipeline Git repository as a remote. The command is provided by the `CICDPipeline` stack as an output. Then push the code to the repository:

```bash
git remote add demo codecommit::<REGION>://SparkTest
git add .
git commit -m 'initial commit'
git push --set-upstream demo main
```

## Cleaning up resources 

1. Delete the `CICDPipeline` stack
   
```
cdk destroy CICDPipeline
```

2. From the console, delete CloudFormation stacks created by the CICD Pipeline 