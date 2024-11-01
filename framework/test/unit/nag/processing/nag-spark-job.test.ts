// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Nag for Spark runtime EMR Serverless
 *
 * @group unit/best-practice/processing/spark-job
 */

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { SparkEmrServerlessJob, SparkEmrServerlessJobApiProps, SparkEmrServerlessRuntime } from '../../../../src/processing';

const app = new App();

const stack = new Stack(app, 'SparkJobRuntimeServerlessStack1111');


const myFileSystemPolicy = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['arn:aws:s3:::s3-bucket/pi.py'],
  })],
});


const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);


new SparkEmrServerlessJob(stack, 'SparkJob', {
  jobConfig: {
    Name: JsonPath.format('test-spark-job-{}', JsonPath.uuid()),
    ApplicationId: '00fcn9hll0rv1j09',
    ClientToken: JsonPath.uuid(),
    ExecutionRoleArn: myExecutionRole.roleArn,
    ExecutionTimeoutMinutes: 30,
    ConfigurationOverrides: {
      MonitoringConfiguration: {
        S3MonitoringConfiguration: {
          LogUri: 's3://monitoring-bucket/monitoring-logs',
        },
      },
    },
    JobDriver: {
      SparkSubmit: {
        EntryPoint: 's3://s3-bucket/pi.py',
        SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
      },
    },
  },
} as SparkEmrServerlessJobApiProps);

Aspects.of(stack).add(new AwsSolutionsChecks());


NagSuppressions.addResourceSuppressionsByPath(stack, '/SparkJobRuntimeServerlessStack1111/SparkJob/EmrPipeline/Role/DefaultPolicy/Resource', [
  { id: 'AwsSolutions-IAM5', reason: 'Job runs generated automatically hence we have to use *' },
]);


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});

