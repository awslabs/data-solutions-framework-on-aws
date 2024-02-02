[//]: # (processing.spark-emr-runtime-serverless)
# Spark EMR Serverless Runtime

A [Spark EMR Serverless Application](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/getting-started.html) with IAM roles and permissions helpers.

## Overview

The construct creates a Spark EMR Serverless Application, with the latest EMR runtime as the default runtime. You can change the runtime by passing your own as a `Resource property` to construct initializer. It also provides methods to create a principal or grant an existing principal (ie IAM Role or IAM User) with the permission to start a job on this EMR Serverless application.

The construct creates a default VPC that is used by EMR Serverless Application. The VPC has `10.0.0.0/16` CIDR range, and comes with an S3 VPC Endpoint Gateway attached to it. The construct also creates a security group for the EMR Serverless Application. You can override this by defining your own `NetworkConfiguration` as defined in the `Resource properties` of the construct initializer.

The construct has the following interfaces:

* A construct Initializer that takes an object as `Resource properties` to modify the default properties. The properties are defined in `SparkEmrServerlessRuntimeProps` interface.
* A method to create an execution role for EMR Serverless. The execution role is scoped down to the EMR Serverless Application ARN created by the construct.
* A method that takes an IAM role to call the `StartJobRun`, and monitors the status of the job.
  * The IAM policies attached to the provided IAM role is as [follow](https://github.com/awslabs/data-solutions-framework-on-aws/blob/c965202f48088f5ae51ce0e719cf92adefac94ac/framework/src/processing/spark-runtime/emr-serverless/spark-emr-runtime-serverless.ts#L117).
  * The role has a `PassRole` permission scoped as [follow](https://github.com/awslabs/data-solutions-framework-on-aws/blob/c965202f48088f5ae51ce0e719cf92adefac94ac/framework/src/processing/spark-runtime/emr-serverless/spark-emr-runtime-serverless.ts#L106).

The construct has the following attributes:

* applicationArn: EMR Serverless Application ARN
* applicationId: EMR Serverless Application ID
* vpc: VPC is created if none is provided
* emrApplicationSecurityGroup: security group created with VPC
* s3GatewayVpcEndpoint: S3 Gateway endpoint attached to VPC

The construct is depicted below:

![Spark Runtime Serverless](../../../website/static/img/adsf-spark-runtime.png)

## Usage

The code snippet below shows a usage example of the `SparkEmrServerlessRuntime` construct.

[example usage](examples/spark-emr-runtime-serverless-default.lit.ts)




[//]: # (processing.spark-job)
# Spark EMR Serverless job

An [Amazon EMR Serverless](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/getting-started.html) Spark job orchestrated through AWS Step Functions state machine.

## Overview

The construct creates an AWS Step Functions state machine that is used to submit a Spark job and orchestrate the lifecycle of the job. The construct leverages the [AWS SDK service integrations](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html) to submit the jobs. The state machine can take a cron expression to trigger the job at a given interval. The schema below shows the state machine:

![Spark EMR Serverless Job](../../../website/static/img/adsf-spark-emr-serverless-job.png)

## Usage

The example stack below shows how to use `EmrServerlessSparkJob` construct. The stack also contains a `SparkEmrServerlessRuntime` to show how to create an EMR Serverless Application and pass it as an argument to the `Spark job` and use it as a runtime for the job.

[example usage spark job on emr serverless](./examples/spark-job-emr-serverless.lit.ts)




[//]: # (processing.pyspark-application-package)
# PySpark Application Package

A PySpark application packaged with its dependencies and uploaded on an S3 artifact bucket.

## Overview

The construct package your PySpark application (the entrypoint, supporting files and virtual environment)
and upload it to an Amazon S3 bucket. In the rest of the documentation we call the entrypoint,
supporting files and virtual environment as artifacts.

The PySpark Application Package has two responsibilities:

* Upload your PySpark entrypoint application to an artifact bucket
* Package your PySpark virtual environment (venv) and upload it to an artifact bucket. The package of venv is done using docker,
  an example in the [Usage](#usage) section shows how to write the Dockerfile to package the application.

The construct uses the [Asset](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets.Asset.html)
to upload the PySpark Application artifacts to CDK Asset bucket. These are then copied to an S3 bucket we call artifact bucket.

To manage the lifecycle of the artifacts as CDK assets, the constructs need Docker daemon running on the local machine.
Make sure to have Docker running before using the construct.

### Construct attributes

The construct exposes the artifacts through the following interfaces:

* entrypointS3Uri: The S3 location where the entry point is saved in S3. You pass this location to your Spark job.
* venvArchiveS3Uri: The S3 location where the archive of the Python virtual environment with all dependencies is stored. You pass this location to your Spark job.
* sparkVenvConf: The Spark config containing the configuration of virtual environment archive with all dependencies.

### Resources created
* An Amazon S3 Bucket to store the PySpark Application artifacts. You can also provide your own if you have already a bucket that you want to use. This bucket comes with configuration to enforce `TLS`, `Block Public Access` and encrypt objects with `SSE-KMS`,
* An IAM role used by a Lambda to copy from the CDK Asset bucket to the artifact bucket created above or provided.

The schema below shows the resources created and the responsible of the construct:

![PySpark Application Package](../../../website/static/img/adsf-pyspark-application-package.png)

## Usage

In this example we will show you how you can use the construct to package a PySpark application
and submit a job to EMR Serverless leveraging DSF `SparkEmrServerlessRuntime` and `SparkJob` constructs.

For this example we assume we will have the folder structure as shown below. We have two folders, one containing
the `PySpark` application called `spark` folder and a second containing the `CDK` code called `cdk`.
The PySpark code, follows the standards `Python` structure. The `spark` also contains the `Dockerfile` to build the `venv`.
In the next [section](#dockerfile-definition) will describe how to structure the `Dockerfile`.

```bash
root
|--spark
|    |--test
|    |--src
|       |--__init__.py
|       |--entrypoint.py
|       |--dir1
|        |--__init__.py
|        |--helpers.py
|    |--requirement.txt
|    |--Dockerfile #contains the build instructions to package the virtual environment for PySpark
|--cdk #contains the CDK application that deploys CDK stack with the PySparkApplicationPackage
```
### PySpark Application Definition

For this example we define the PySparkApplicationPackage resource as follows:

[example pyspark application](./examples/pyspark-application-package.lit.ts)

### Dockerfile definition

The steps below describe how to create the `Dockerfile` so it can be used to be package `venv` by the construct

* In order to build the virtual environment, the docker container will mount the `dependencies_folder`, in our case we define it as `./../spark`.
* Then to package the `venv` we need to build `COPY` all the files in `./spark` to the docker container.
* Last we execute the `venv-package`, in the [PySparkApplication](#pyspark-application-definition) we passed the `venv_archive_path` as `/venv-package/pyspark-env.tar.gz`.
  So we need to create it with `mkdir /venv-package` and then pass it to the `venv-package` as `venv-pack -o /venv-package/pyspark-env.tar.gz`

```Dockerfile
FROM --platform=linux/amd64 public.ecr.aws/amazonlinux/amazonlinux:latest AS base

RUN dnf install -y python3

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY . .

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install venv-pack==0.2.0 && \
    python3 -m pip install .

RUN mkdir /venv-package && venv-pack -o /venv-package/pyspark-env.tar.gz && chmod ugo+r /venv-package/pyspark-env.tar.gz
```

### Define a CDK stack upload PySpark application and run the job

The stack below leverages the resources defined above for PySpark to build the end to end example for building and submitting a PySpark job.

[example pyspark app on emr serverless](./examples/pyspark-application-emr-serverless.lit.ts)




[//]: # (processing.spark-cicd-pipeline)
# Spark CI/CD Pipeline

Self-mutable CI/CD pipeline for a Spark application based on [Amazon EMR](https://aws.amazon.com/fr/emr/) runtime.

## Overview

The CI/CD pipeline uses [CDK Pipeline](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html) and provisions all the resources needed to implement a CI/CD pipeline for a Spark application on Amazon EMR, including:
* A CodeCommit repository to host the code
* A CodePipeline triggered from the main branch of the CodeCommit repository to process the CI/CD tasks
* A CodeBuild stage to build the CDK assets and run the Spark unit tests
* A Staging stage to deploy the application stack in the staging environment and run optional integration tests
* A Production stage to deploy the application stack in the production environment


![Spark CI/CD Pipeline](../../../website/static/img/adsf-spark-cicd.png)

## Cross-account deployment

You can use the same account or optionally use different accounts for CI/CD (where this construct is deployed), staging and production (where the application stack is deployed).
If using different accounts, bootstrap staging and production accounts with CDK and add a trust relationship from the CI/CD account:
```bash
cdk bootstrap --profile staging \
aws://<STAGING_ACCOUNT_ID>/<REGION> \
--trust <CICD_ACCOUNT_ID> \
--cloudformation-execution-policies "POLICY_ARN"
```
More information is available [here](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html#cdk_pipeline_bootstrap)

You need to also provide the accounts information in the cdk.json in the form of:
```json
{
  "staging": {
    "account": "<STAGING_ACCOUNT_ID>",
    "region": "<REGION>"
  },
  "prod": {
    "account": "<PROD_ACCOUNT_ID>",
    "region": "<REGION>"
  }
}
```

## Defining a CDK Stack for the Spark application

The `SparkCICDPipeline` construct deploys an application stack, which contains your business logic, into staging and production environments.
The application stack is a standard CDK stack that you provide. It's expected to be passed via a factory class.

To do this, implement the `ApplicationStackFactory` and its `createStack()` method.
The `createStack()` method needs to return a `Stack` instance within the scope passed to the factory method.
This is used to create the application stack within the scope of the CDK Pipeline stage.

The `CICDStage` parameter is automatically passed by the CDK Pipeline via the factory method and allows you to customize the behavior of the Stack based on the stage.
For example, staging stage is used for integration tests so testing a processing job should be done via manually triggering it.
In opposition to production stage where the processing job could be automated on a regular basis.

Create your application stack using the factory pattern:

[example application stack factory](./examples/cicd-application-stack.lit.ts)

Use the factory to pass your application stack to the `SparkCICDPipeline` construct:

[example cicd pipeline stack](./examples/cicd-pipeline-stack.lit.ts)

## Unit tests
The construct triggers the unit tests as part of the CI/CD process using the EMR docker image and a fail fast approach.
The unit tests are run during the first build step and the entire pipeline stops if the unit tests fail.

Units tests are expected to be run with `pytest` command after a `pip install .` is run from the Spark root folder configured via `sparkPath`.

In your Pytest script, use a Spark session with a local master and client mode as the unit tests run in a local EMR docker container:
```python
spark = (
        SparkSession.builder.master("local[1]")
        .appName("local-tests")
        .config("spark.submit.deployMode", "client")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .getOrCreate()
    )
```

## Integration tests
You can optionally run integration tests as part of the CI/CD process using the AWS CLI in a bash script that return `0` exit code if success and `1` if failure.
The integration tests are triggered after the deployment of the application stack in the staging environment. 

You can run them via `integTestScript` path that should point to a bash script. For example:

```bash
root
|--spark
|    |--integ.sh
|--cdk
```

`integ.sh` is a standard bash script using the AWS CLI to validate the application stack. In the following script example, a Step Function from the application stack is triggered and the result of its execution should be successful:
```bash
#!/bin/bash
EXECUTION_ARN=$(aws stepfunctions start-execution --state-machine-arn $STEP_FUNCTION_ARN | jq -r '.executionArn')
while true
do
    STATUS=$(aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN | jq -r '.status')
    if [ $STATUS = "SUCCEEDED" ]; then
        exit 0 
    elif [ $STATUS = "FAILED" ] || [ $STATUS = "TIMED_OUT" ] || [ $STATUS = "ABORTED" ]; then
        exit 1 
    else 
        sleep 10
        continue
    fi
done
```

To use resources that are deployed by the Application Stack like the Step Functions state machine ARN in the previous example:
1. Create a `CfnOutput` in your application stack with the value of your resource

[example application stack output](./examples/cicd-application-stack-output.lit.ts)

2. Pass an environment variable to the `SparkCICDPipeline` construct in the form of a key/value pair via `integTestEnv`:
 * Key is the name of the environment variable used in the script: `STEP_FUNCTION_ARN` in the script example above.
 * Value is the CloudFormation output name from the application stack: `ProcessingStateMachineArn` in the application stack example above.
 * Add permissions required to run the integration tests script. In this example, `states:StartExecution` and `states:DescribeExecution`.

[example cicd with integration tests](./examples/cicd-pipeline-stack-tests.lit.ts)



[//]: # (processing.spark-emr-runtime-containers)
# Spark EMR Containers Runtime

An EMR on EKS runtime with preconfigured EKS cluster. 

## Overview

The constructs creates an EKS cluster, install the necessary controllers and enable it to be used by EMR on EKS service as described in this [documentation](https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/setting-up-cluster-access.html). The following are the details of the components deployed.

 * An EKS cluster (VPC configuration can be customized)
 * A tooling nodegroup to run various tools including controllers
 * Kubernetes controlers: EBS CSI Driver, Karpenter, ALB Ingress Controller, cert-manager  
 * Optional default Kaprenter `NodePools` and `EC2NodeClass` as listed [here](https://github.com/awslabs/data-solutions-framework-on-aws/tree/main/framework/src/processing/lib/spark-runtime/emr-containers/resources/k8s/karpenter-provisioner-config).
 * An S3 bucket to store the pod templates for the `NodePools` created above.

Additionally, the construct exposes methods to facilitate the creation of EC2 capacity, Virtual Cluster and Execution roles. 

## Usage

The code snippet below shows a usage example of the `SparkEmrContainersRuntime` construct.

[example usage](./examples/spark-emr-runtime-containers-default.lit.ts)

The sceenshot below show how the cloudformation will look like once you deploy the example.

![Spark EMR Containers Cloudfromation Output](../../../website/static/img/emr-eks-construct-cloudformation-output.png)

You can execute the following command to run a sample job with the infratructure deployed using SparkEmrContainerRuntime:

```sh
aws emr-containers start-job-run \
--virtual-cluster-id FROM-CFNOUTPUT-VIRTUAL_CLUSTER_ID \
--name spark-pi \
--execution-role-arn FROM-CFNOUTPUT-jOB_EXECUTION_ROLE_ARN \
--release-label emr-7.0.0-latest \
--job-driver '{
    "sparkSubmitJobDriver": {
        "entryPoint": "s3://aws-data-analytics-workshops/emr-eks-workshop/scripts/pi.py",
        "sparkSubmitParameters": "--conf spark.executor.instances=8 --conf spark.executor.memory=2G --conf spark.executor.cores=2 --conf spark.driver.cores=1 --conf spark.kubernetes.driver.podTemplateFile=FROM-CFNOUTPUT-DRIVER-POD-TEMPLATE --conf spark.kubernetes.executor.podTemplateFile=FROM-CFNOUTPUT-EXECUTOR-POD-TEMPLATE"
        }
    }'
```

:::warning IAM role requirements

Make sure the role used for running has the correct [IAM policy](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonemroneksemrcontainers.html#amazonemroneksemrcontainers-actions-as-permissions) with `StartJobRun` permission to execute the job.

:::


### Isolating workloads on a shared cluster

With EMR on EKS you can leverage the same EKS cluster to run Spark jobs from multiple teams leveraging namespace segragation through the EMR virtual cluster. The `SparkEMRContainersRuntime` simplifies the creation of an EMR virtual cluster. 
The `addEmrVirtualCluster()` method enables the EKS cluster to be used by EMR on EKS through the creation EMR on EKS virtual cluster.
The method configures the right Kubernetes RBAC as described [here](https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/setting-up-cluster-access.html). It can optionally create the namespace for you.

[example virtual cluster](./examples/spark-emr-runtime-containers-virtual-cluster.lit.ts)

### EC2 Capacity

The EC2 capacity to execute the jobs is defined with [Karpenter](https://karpenter.sh/docs/getting-started/) `NodePools` and `EC2NodeClass`. By default, the construct configure Karpenter `NodePools` and `EC2NodeClass` for 3 types of workloads:
 * Critical workloads
 * Shared workloads
 * Notebook workloads
You can opt out from their creation by setting the `default_nodes` to `False`. 

To run EMR on EKS jobs on this EC2 capacity, the construct creates [Pod templates](https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/pod-templates.html) and uploads them to an S3 bucket (created by the construct). 
The pod template are provided for both the Spark driver and the Spark executors and for each of the workload types. They are configured to schedule the Spark pods on the corresponding Karpenter `NodePools` and `EC2NodeClass`. 
The pod templates locations are stored as class attribute and can be exposed via CloudFormation outputs. 
The usage example below shows how to provide these as CloudFormation output. The pod templates are referenced in your `spark configuration` that is part of your job defintion.

[example ec2 capacity](./examples/spark-emr-runtime-containers-ec2-capacity.lit.ts)

The construct also exposes the `addKarpenterNodePoolAndNodeClass()` method to define your own EC2 capacity. This method takes a YAML file as defined in [Karpenter](https://karpenter.sh/docs/getting-started/getting-started-with-karpenter/#5-create-nodepool) and apply it to the EKS cluster. You can consult an example [here](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/src/processing/lib/spark-runtime/emr-containers/resources/k8s/karpenter-provisioner-config/v0.32.1/critical-provisioner.yml).


### Execution role

The execution role is the IAM role that is used by the Spark job to access AWS resources. For example, the job may need to access an S3 bucket that stores the source data or to which the job writes the data. The `createExecutionRole()` method simplifies the creation of an IAM role that can be used to execute a Spark job on the EKS cluster and in a specific EMR EKS virtual cluster namespace. The method attaches an IAM policy provided by the user and a policy to access the pod templates when using the default EC2 capacity.

[example execution role](./examples/spark-emr-runtime-containers-execrole.lit.ts)


### Interactive endpoint

The interactive endpoint provides the capability for interactive clients like Amazon EMR Studio or a self-hosted Jupyter notebook to connect to Amazon EMR on EKS clusters to run interactive workloads. The interactive endpoint is backed by a Jupyter Enterprise Gateway that provides the remote kernel lifecycle management capability that interactive clients need.

[example interactive endpoint](./examples/spark-emr-runtime-containers-interactive-endpoint.lit.ts)

### Grant Job Execution

The Grant Job Execution allow you to provide an IAM role the rights to start the execution of a job and monitor it in a given virtual cluster. The policy attached will be as follow.

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": [
				"emr-containers:DescribeJobRun",
				"emr-containers:ListJobRuns"
			],
			"Resource": "arn:aws:emr-containers:REGION:ACCOUNT-ID:/virtualclusters/aaabbccmmm",
			"Effect": "Allow"
		},
		{
			"Condition": {
				"ArnEquals": {
					"emr-containers:ExecutionRoleArn": [
						"arn:aws:iam::ACCOUNT-ID:role/s3ReadExecRole"
					]
				}
			},
			"Action": "emr-containers:StartJobRun",
			"Resource": "arn:aws:emr-containers:REGION:ACCOUNT-ID:/virtualclusters/aaabbccmmm",
			"Effect": "Allow"
		},
		{
			"Action": "emr-containers:TagResource",
			"Resource": "arn:aws:emr-containers:REGION:ACCOUNT-ID:/virtualclusters/aaabbccmmm/jobruns/*",
			"Effect": "Allow"
		}
	]
}
```

[example interactive endpoint](./examples/spark-emr-runtime-containers-grant-execution.lit.ts)
