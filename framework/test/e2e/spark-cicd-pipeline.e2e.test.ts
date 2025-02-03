// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for SparkCICDPipeline
 *
 * @group e2e/processing/default-spark-cicd
 */

import { RemovalPolicy, CfnOutput, Stack, StackProps, App } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { TestStack } from './test-stack';
import { SparkEmrCICDPipeline, SparkImage } from '../../src/processing';
import { ApplicationStackFactory, CICDStage } from '../../src/utils';

jest.setTimeout(9000000);

// GIVEN
const app = new App();
const cicdStack = new Stack(app, 'DefaultCICDStack', {
  env: {
    region: 'eu-west-1',
  },
});
const testStack = new TestStack('SparkCICDPipelineTestStack', app, cicdStack);
const { stack } = testStack;

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
stack.node.setContext('staging', { accountId: stack.account, region: stack.region });
stack.node.setContext('prod', { accountId: stack.account, region: stack.region });

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
  source: CodePipelineSource.connection('owner/weekly-job', 'mainline', {
    connectionArn: 'arn:aws:codeconnections:eu-west-1:123456789012:connection/aEXAMPLE-8aad-4d5d-8878-dfcab0bc441f',
  }),
  removalPolicy: RemovalPolicy.DESTROY,
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