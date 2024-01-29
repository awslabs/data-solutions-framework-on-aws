// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleSparkJobEmrServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    const runtime = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntime', {
      name: 'mySparkRuntime',
    });
    
    /// !hide
    const s3ReadPolicy = new PolicyDocument({
      statements: [
        PolicyStatement.fromJson({
          actions: ['s3:GetObject'],
          resources: ['arn:aws:s3:::bucket_name', 'arn:aws:s3:::bucket_name/*'],
        }),
      ],
    });
    const executionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'EmrServerlessExecutionRole', s3ReadPolicy);
    
    /// !show
    const applicationPackage = new dsf.processing.PySparkApplicationPackage(this, 'PySparkApplicationPackage', {
      applicationName: 'nightly-job-aggregation',
      entrypointPath: './../spark/src/entrypoint.py',
      dependenciesFolder: './../spark',
      venvArchivePath: '/venv-package/pyspark-env.tar.gz',
    });
    
    new dsf.processing.SparkEmrServerlessJob(this, 'SparkNightlyJob', {
      applicationId: runtime.application.attrApplicationId,
      name: 'nightly_job',
      executionRoleArn: executionRole.roleArn,
      executionTimeoutMinutes: 30,
      s3LogUri: 's3://emr-job-logs-EXAMPLE/logs',
      sparkSubmitEntryPoint: applicationPackage.entrypointS3Uri, // use the application package entrypoint
      sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=2 {sparkEnvConf}',
    });
    /// !hide
  }
}

const app = new cdk.App();
new ExampleSparkJobEmrServerlessStack(app, 'ExampleSparkJobEmrServerlessStack');
