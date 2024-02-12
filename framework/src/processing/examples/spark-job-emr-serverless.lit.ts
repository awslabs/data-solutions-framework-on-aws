// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleSparkJobEmrServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !hide
    const runtime = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntime', {
      name: 'mySparkRuntime',
    });
    
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
    const nightJob = new dsf.processing.SparkEmrServerlessJob(this, 'PiJob', {
      applicationId: runtime.application.attrApplicationId,
      name: 'PiCalculation',
      executionRoleArn: executionRole.roleArn,
      sparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
    });
    
    new CfnOutput(this, 'job-state-machine', {
      value: nightJob.stateMachine!.stateMachineArn,
    });
    /// !hide
  }
}

const app = new cdk.App();
new ExampleSparkJobEmrServerlessStack(app, 'ExampleSparkJobEmrServerlessStack');
