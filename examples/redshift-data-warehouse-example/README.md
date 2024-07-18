# Redashift Data Warehouse example 

In this example, we build a Data Warehouse on top of a Data Lake to support large interactive SQL queries with high performance and low latency. This `README` is a step-by-step deployment guide. You can read more details about this example solution in the [documentation](https://awslabs.github.io/data-solutions-framework-on-aws/docs/examples/redshift-data-warehouse)

## Pre-requisite

1. Docker
2. [Install the AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
3. [Bootstrap the AWS account](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

```bash
cdk bootstrap \
--profile <YOUR_AWS_PROFILE> \
--cloudformation-execution-policies “POLICY_ARN” \
aws://<ACCOUNT_ID>/<REGION>
```

## Getting started

1. Download the Redshift Data Warehouse example from the Data Solutions Framework on AWS Github and unzip it:

```bash
curl -LJO https://github.com/awslabs/data-solutions-framework-on-aws/releases/latest/download/redshift-data-warehouse-example.zip
unzip redshift-data-warehouse-example.zip -d redshift-data-warehouse-example
cd redshift-data-warehouse-example
```

2. Modify the `./requirements.txt` to add the `cdklabs.aws_data_solutions_framework` library as a dependency:

```
aws-cdk-lib
constructs>=10.3.0, <11.0.0
cdklabs.aws_data_solutions_framework
```

2. Create Python3 virtual environment and activate it:

```bash
python3 -m venv .venv 
source .venv/bin/activate 
```

3. Install the DSF on AWS library:

```bash
pip install -r requirements.txt 
```

4. Configure the global removal policy if you want to delete all the resources including the data when deleting the example.


   Create a `cdk.context.json` file with the following content:

```json
{
  "@data-solutions-framework-on-aws/removeDataOnDestroy": true
}
```

5. Uncomment these 2 lines in the `infra/app.py` file:

```python
    # region=os.environ["CDK_DEFAULT_REGION"],
    # account=os.environ["CDK_DEFAULT_ACCOUNT"]
```
   
6. Set the environment variables for cross account deployments

```bash
export CDK_DEFAULT_REGION=<DEV_REGION>
export CDK_DEFAULT_ACCOUNT=<DEV_ACCOUNT_ID> 
```

1. Deploy the stack:

```
cdk deploy
```

## Validate results

1. Access the Redshift query editor from the AWS Console
2. Connect to the `consumer` workgroup and the `marketing` database
3. Query the data from the `mv_product_analysis` view 

## Cleaning up resources 

1. Delete the stack
   
```
cdk destroy
```