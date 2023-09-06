// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataLakeStorage
 *
 * @group unit/best-practice/processing/spark-cicd-pipeline
 */

import { App, Aspects, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { ApplicationStack, ApplicationStackFactory, ApplicationStackProps, SparkCICDPipeline, SparkImage } from '../../../../src';

const app = new App();
const stack = new Stack(app, 'Stack');

class MyApplicationStack extends ApplicationStack {
  
  constructor(scope: Stack, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
    
    const bucket = new Bucket(this, 'TestBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}

class MyStackFactory implements ApplicationStackFactory {
  createStack(scope: Stack, id: string, props: ApplicationStackProps): Stack {
    return new MyApplicationStack(scope, id, props);
  }
}

new SparkCICDPipeline(stack, 'TestConstruct', {
  applicationName: 'test',
  applicationStackFactory: new MyStackFactory(),
  cdkPath: 'cdk/',
  sparkPath: 'spark/',
  sparkImage: SparkImage.EMR_SERVERLESS_6_10,
  integTestScript: 'cdk/integ-test.sh',
  integTestEnv: {
    TEST_BUCKET: 'BucketName',
  },
});

Aspects.of(stack).add(new AwsSolutionsChecks());

// NagSuppressions.addResourceSuppressionsByPath(
//   stack,
//   '/Stack/TestConstruct/CodePipeline/Pipeline/ArtifactsBucket/Resource',
//   [{ id: 'AwsSolutions-S1', reason: 'This bucket is provided by CDK Pipeline L2 construct' }],
// );

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline',
  [{ id: 'AwsSolutions-IAM5', reason: 'This policy is provided by CDK Pipeline L2 construt' }],
  true,
);

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