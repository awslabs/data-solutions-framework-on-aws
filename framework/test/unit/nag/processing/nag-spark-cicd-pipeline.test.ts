// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataLakeStorage
 *
 * @group unit/best-practice/processing/spark-cicd-pipeline
 */

import { App, Aspects, CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { SparkEmrCICDPipeline, SparkImage } from '../../../../src/processing';
import { ApplicationStackFactory, CICDStage } from '../../../../src/utils';

const app = new App();
const stack = new Stack(app, 'Stack', {
  env: {
    region: 'us-east-1',
  },
});
stack.node.setContext('staging', { accountId: '123456789012', region: 'us-east-1' });
stack.node.setContext('prod', { accountId: '123456789012', region: 'us-east-1' });

interface MyApplicationStackProps extends StackProps {
  readonly prodBoolean: Boolean;
}

class MyApplicationStack extends Stack {

  constructor(scope: Stack, id: string, props?: MyApplicationStackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'TestBucket', {
      autoDeleteObjects: true,
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
  sparkImage: SparkImage.EMR_6_11,
  integTestScript: 'cdk/integ-test.sh',
  integTestEnv: {
    TEST_BUCKET: 'BucketName',
  },
  integTestPermissions: [
    new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['*'],
    }),
  ],
});

Aspects.of(stack).add(new AwsSolutionsChecks());

// Force the pipeline construct creation forward before applying suppressions.
// @See https://github.com/aws/aws-cdk/issues/18440
cicd.pipeline.buildPipeline();

// NagSuppressions.addResourceSuppressionsByPath(
//   stack,
//   '/Stack/TestConstruct/CodePipeline/Pipeline/ArtifactsBucket/Resource',
//   [{ id: 'AwsSolutions-S1', reason: 'This bucket is provided by CDK Pipeline construct' }],
// );

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

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/TestConstruct/CodePipeline/Pipeline/Build/CodeBuildSynthStep/CdkBuildProject/Resource',
  [{ id: 'AwsSolutions-CB3', reason: 'The priviledge mode is used by CDK Pipeline construct when enabling Docker' }],
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