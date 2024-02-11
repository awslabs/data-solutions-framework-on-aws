// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';

/// !show
class ExampleSparkJobEmrEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const dailyJob = new dsf.processing.SparkEmrContainerJob(this, 'SparkNightlyJob', {
      name: 'daily_job',
      virtualClusterId: 'exampleId123',
      executionRole: Role.fromRoleArn(this, 'ExecutionRole', 'arn:aws:iam::123456789012:role/role'),
      executionTimeout: cdk.Duration.minutes(15),
      s3LogBucket: Bucket.fromBucketName(this, 'LogBucket', 'emr-job-logs-EXAMPLE'), 
      s3LogPrefix: 'logs',
      sparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
      sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
    });
    
    new CfnOutput(this, 'daily-job-state-machine', {
      value: dailyJob.stateMachine!.stateMachineArn,
    });
  }
}
/// !hide

const app = new cdk.App();
new ExampleSparkJobEmrEksStack(app, 'ExampleSparkJobEmrEksStack');
