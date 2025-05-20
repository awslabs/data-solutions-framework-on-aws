# DataZone Streaming governance example 

In this example, we build a streaming governance for Amazon MSK topics using Amazon DataZone. This `README` is a step-by-step deployment guide.

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

1. Download the DataZone MSK example from the Data Solutions Framework on AWS Github and unzip it:

```bash
curl -LJO https://github.com/awslabs/data-solutions-framework-on-aws/releases/latest/download/datazone-msk-governance-example.zip
unzip datazone-msk-governance-example.zip -d datazone-msk-governance-example
cd datazone-msk-governance-example
```

2. Modify the `./requirements.txt` to add the `cdklabs.aws_data_solutions_framework` library as a dependency:

```
aws-cdk-lib==2.178.0
aws-cdk.aws_lambda_python_alpha~=2.178.0a0
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
   
5. Set the environment variables for DataZone

```bash
export DATAZONE_PORTAL_ROLE_NAME=<ROLE_USED_FOR_DATAZONE_UI> 
```

1. Deploy the stack:

```
cdk deploy
```

## Verify the example is working

1. In the AWS Lambda console, search for the `ProducerLambda` and run a test with the default test event
2. In the DataZone portal, request access to the `producer_data_product` in the `consumer` project
2. From the `producer` project, approve the subscription request
3. In the `consumer` project, check the asset is added to the custom environment
4. From the Amazon Managed Steaming for Apache Flink console, start the `flink-consumer` application
5. Go back into the DataZone console and check the lineage on the MSK topic, the consumer application should have registered itself as a consumer

## Cleaning up resources 

1. Stop the MSF application from the MSF console
2. Revoke the subscription from the DataZone UI
3. Delete the stack
   
```
cdk destroy
```