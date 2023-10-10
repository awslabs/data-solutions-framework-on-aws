---
sidebar_position: 1
sidebar_label: Spark Data Lake example
---

# Spark Data Lake

Build a data lake, and process data with Spark.

In this example, we will be using AWS DSF to quickly build an end-to-end solution to store and process the data, with a multi-environment CICD pipeline (staging, production) for the application logic. Our Spark application will process NYC Taxi dataset.

We will be using several constructs from the AWS DSF:
- [`DataLakeStorage`](/docs/constructs/library/data-lake-storage)
- [`DataCatalogDatabase`](/docs/constructs/library/data-catalog-database)
- [`DataLakeStorage`](/docs/constructs/library/data-lake-storage)
- [`SparkEMRServerlessRuntime`](/docs/constructs/library/spark-emr-serverless-runtime)
- [`SparkEmrServerlessJob`](/docs/constructs/library/spark-job)
- [`SparkEmrCICDPipeline`](/docs/constructs/library/spark-cicd-pipeline)
- [`ApplicationStackFactory`](/docs/constructs/library/spark-cicd-pipeline#defining-a-cdk-stack-for-the-spark-application)
- [`PySparkApplicationPackage`](/docs/constructs/library/pyspark-application-package)

This is what we will bulild!

![Data lake storage](../../../static/img/spark-data-lake.png)

## Deployment guide

You can follow the [deployment guide](https://github.com/awslabs/aws-data-solutions-framework/tree/main/examples/spark-data-lake) from AWS DSF GitHub repo to deploy the solution.