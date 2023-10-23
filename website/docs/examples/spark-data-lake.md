---
sidebar_position: 2
sidebar_label: Spark Data Lake example
---

# Spark Data Lake

Build a data lake, and process data with Spark.

This example demonstrates the benefits of reusing AWS DSF components to remove undifferentiated infrastructure setup and maintenance tasks from data engineers so they can focus on business use cases and extracting value from data.

In this example, we will be using AWS DSF to quickly build an end-to-end solution to store and process the data. The solution is production-ready, with local development compatiblity and a multi-environment CICD pipeline (staging, production) for deployment. 
The business use case implemented within the Spark application is a simple aggregation pipeline processing NYC Taxi dataset but it could use any business logic.

**This is what we will build in minutes and less than one hundred lines of codes!** Starting from scratch would require days and thousands of lines of code.

![Spark Data Lake](../../static/img/spark-data-lake.png)


We will be using several constructs from the AWS DSF:
- [`DataLakeStorage`](/docs/constructs/library/data-lake-storage)
- [`DataLakeCatalog`](/docs/constructs/library/data-lake-catalog)
- [`SparkEmrServerlessRuntime`](/docs/constructs/library/spark-emr-serverless-runtime)
- [`SparkEmrServerlessJob`](/docs/constructs/library/spark-job)
- [`SparkEmrCICDPipeline`](/docs/constructs/library/spark-cicd-pipeline)
- [`ApplicationStackFactory`](/docs/constructs/library/spark-cicd-pipeline#defining-a-cdk-stack-for-the-spark-application)
- [`PySparkApplicationPackage`](/docs/constructs/library/pyspark-application-package)

## Deployment guide

You can follow the [deployment guide](https://github.com/awslabs/aws-data-solutions-framework/tree/main/examples/spark-data-lake) from AWS DSF GitHub repo to deploy the solution.