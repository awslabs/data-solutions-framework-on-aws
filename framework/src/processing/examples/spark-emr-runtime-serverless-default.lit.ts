// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleSparkEmrServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const runtimeServerless = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntimeServerless', {
      name: 'spark-serverless-demo',
    });
    
    const s3ReadPolicyDocument = new PolicyDocument({
      statements: [
        PolicyStatement.fromJson({
          actions: ['s3:GetObject'],
          resources: ['arn:aws:s3:::bucket_name'],
        }),
      ],
    });
    
    // The IAM role that will trigger the Job start and will monitor it
    const jobTrigger = new Role(this, 'EMRServerlessExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    
    const executionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'EmrServerlessExecutionRole', s3ReadPolicyDocument);
    
    runtimeServerless.grantStartExecution(jobTrigger, executionRole.roleArn);
    
    new cdk.CfnOutput(this, 'SparkRuntimeServerlessStackApplicationArn', {
      value: runtimeServerless.application.attrArn,
    });
  }
}
/// !hide

const app = new cdk.App();
new ExampleSparkEmrServerlessStack(app, 'ExampleSparkEmrServerlessStack');