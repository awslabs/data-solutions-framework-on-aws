// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * E2E test for SparkCICDPipeline
 *
 * @group e2e/spark-cicd-pipeline
 */

import { RemovalPolicy, CfnOutput, Stack, StackProps, App } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { TestStack } from './test-stack';
import { ApplicationStackFactory, SparkEmrCICDPipeline, SparkImage, CICDStage } from '../../src';

jest.setTimeout(9000000);

// GIVEN
const app = new App();
const cicdStack = new Stack(app, 'CICDStack', {
  env: {
    region: 'eu-west-1',
  },
});
const testStack = new TestStack('SparkCICDPipelineTestStack', app, cicdStack);
const { stack } = testStack;

stack.node.setContext('staging', { accountId: '123456789012', region: 'eu-west-1' });
stack.node.setContext('prod', { accountId: '123456789012', region: 'eu-west-1' });

interface MyApplicationStackProps extends StackProps {
  readonly prodBoolean: Boolean;
}

class MyApplicationStack extends Stack {

  constructor(scope: Stack, id: string, props?: MyApplicationStackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'TestBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}

class MyStackFactory implements ApplicationStackFactory {
  createStack(scope: Stack, stage: CICDStage): Stack {
    return new MyApplicationStack(scope, 'MyApplication', {
      prodBoolean: stage === CICDStage.PROD,
    } as MyApplicationStackProps);
  }
}

const cicd = new SparkEmrCICDPipeline(stack, 'TestConstruct', {
  sparkApplicationName: 'test',
  applicationStackFactory: new MyStackFactory(),
  cdkApplicationPath: 'cdk/',
  sparkApplicationPath: 'spark/',
  sparkImage: SparkImage.EMR_6_10,
  integTestScript: 'cdk/integ-test.sh',
  integTestEnv: {
    TEST_BUCKET: 'BucketName',
  },
});

// Force the pipeline construct creation forward before applying suppressions.
// @See https://github.com/aws/aws-cdk/issues/18440
cicd.pipeline.buildPipeline();

new CfnOutput(stack, 'CodePipelineArn', {
  value: cicd.pipeline.pipeline.pipelineArn,
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 900000);

it('bucket created successfully', async () => {
  // THEN
  expect(deployResult.CodePipelineArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);