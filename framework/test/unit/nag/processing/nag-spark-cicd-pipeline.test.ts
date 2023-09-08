// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests DataLakeStorage
 *
 * @group unit/best-practice/processing/spark-cicd-pipeline
 */

import { App, Aspects, CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { ApplicationStackFactory, CICDStage, SparkCICDPipeline, SparkImage } from '../../../../src';

const app = new App();
const stack = new Stack(app, 'Stack',{
  env: {
    region: 'us-east-1',
  }
});

interface MyApplicationStackProps extends StackProps {
  readonly prodBoolean: Boolean;
}

class MyApplicationStack extends Stack {

  constructor(scope: Stack, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'TestBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}

class MyStackFactory implements ApplicationStackFactory {
  createStack(scope: Stack,stage: CICDStage): Stack {
    return new MyApplicationStack(scope, 'MyApplication', {
      prodBoolean: stage === CICDStage.PROD,
    } as MyApplicationStackProps);
  }
}

const cicd = new SparkCICDPipeline(stack, 'TestConstruct', {
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

// Force the pipeline construct creation forward before applying suppressions.
// @See https://github.com/aws/aws-cdk/issues/18440
cicd.pipeline.buildPipeline();

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/ArtifactsBucket/Resource',
  [{ id: 'AwsSolutions-S1', reason: 'This bucket is provided by CDK Pipeline construct' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/Role',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/Source/CodeCommit/CodePipelineActionRole',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/Build/CodeBuildSynthStep/CdkBuildProject/Role',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/Staging/IntegrationTests/IntegrationTests/Role',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/UpdatePipeline/SelfMutation/Role',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Assets/FileRole',
  [{ id: 'AwsSolutions-IAM5', reason: 'This role is provided by CDK Pipeline construt' }],
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