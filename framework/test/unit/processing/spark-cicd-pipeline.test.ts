// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
* Tests SparkCICDPipeline construct
*
* @group unit/spark-processing
*/

import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { SparkCICDPipeline, ApplicationStackFactory, SparkImage, CICDStage } from '../../../src';


describe('With minimal configuration, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'TestStack', {
    env: {
      region: 'us-east-1',
    },
  });
  stack.node.setContext('staging', { accountId: '123456789012', region: 'us-east-1' });
  stack.node.setContext('prod', { accountId: '123456789012', region: 'us-east-1' });

  class MyApplicationStack extends Stack {

    constructor(scope: Stack, id: string) {
      super(scope, id);

      new Bucket(this, 'TestBucket', {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }
  }

  class MyStackFactory implements ApplicationStackFactory {
    createStack(scope: Stack, stage: CICDStage): Stack {
      console.log(stage);
      return new MyApplicationStack(scope, 'MyApplication');
    }
  }

  new SparkCICDPipeline(stack, 'TestConstruct', {
    applicationName: 'test',
    applicationStackFactory: new MyStackFactory(),
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a code repository', () => {
    template.resourceCountIs('AWS::CodeCommit::Repository', 1);
  });

  test('should output the code repository URL', () => {
    template.hasOutput('*', {
      Value: {
        'Fn::GetAtt': [Match.anyValue(), 'CloneUrlHttp'],
      },
    });
  });

  test('should create a code pipeline', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
  });

  test('should create 3 code build projects', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 3);
  });

  test('should create a synth stage with the proper build commands based on the operating system', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*npm run build.*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should create a synth stage with the proper cdk project default path', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*cd \..*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should run the unit tests with EMR 6.12 as the default', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*--name pytest public.ecr.aws/emr-on-eks/spark/emr-6.12.0:latest.*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should create integration stage for Staging', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: Match.objectLike({
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
              }),
              Configuration: Match.objectLike({
                StackName: 'Staging-MyApplication',
              }),
              InputArtifacts: [
                {
                  Name: 'CodeBuildSynthStep_Output',
                },
              ],
              Name: 'Deploy',
            }),
          ]),
          Name: 'Staging',
        }),
      ]),
    });
  });

  test('should create integration stage for Production', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Actions: [
            {
              ActionTypeId: Match.objectLike({
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
              }),
              Configuration: Match.objectLike({
                StackName: 'Production-MyApplication',
              }),
              InputArtifacts: [
                {
                  Name: 'CodeBuildSynthStep_Output',
                },
              ],
              Name: 'Deploy',
            },
          ],
          Name: 'Production',
        }),
      ]),
    });
  });
});

describe('With custom configuration, the construct', () => {

  const app = new App();
  const stack = new Stack(app, 'TestStack', {
    env: {
      region: 'us-east-1',
    },
  });
  stack.node.setContext('staging', { accountId: '123456789012', region: 'us-east-1' });
  stack.node.setContext('prod', { accountId: '123456789012', region: 'us-east-1' });

  class MyApplicationStack extends Stack {

    constructor(scope: Stack, id: string) {
      super(scope, id);

      const bucket = new Bucket(this, 'TestBucket', {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    }
  }

  class MyStackFactory implements ApplicationStackFactory {
    createStack(scope: Stack, stage: CICDStage): Stack {
      console.log(stage);
      return new MyApplicationStack(scope, 'MyApplication');
    }
  }

  new SparkCICDPipeline(stack, 'TestConstruct', {
    applicationName: 'test',
    applicationStackFactory: new MyStackFactory(),
    cdkPath: 'cdk/',
    sparkPath: 'spark/',
    sparkImage: SparkImage.EMR_6_11,
    integTestScript: 'cdk/integ-test.sh',
    integTestEnv: {
      TEST_BUCKET: 'BucketName',
    },
    integTestPermissions: [
      new PolicyStatement({
        actions: [
          's3:GetObject',
        ],
        resources: ['*'],
      }),
    ],
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CodeBuild project with the proper cdk project path for synth', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*cd cdk/.*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should create a CodeBuild project with the proper Spark project path for unit tests', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*docker run -i -v \\$\\(pwd\\)/spark/:/home/hadoop/.*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should create a CodeBuild project with the proper Spark image for unit tests', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*--name pytest public.ecr.aws/emr-on-eks/spark/emr-6.11.0:latest.*'),
      },
      Description: Match.stringLikeRegexp('.*CodeBuildSynthStep.*'),
    });
  });

  test('should get the CfnOutput from the application stack and use it in the integration tests stage', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Actions: Match.arrayWith([
            Match.objectLike({
              Configuration: Match.objectLike({
                EnvironmentVariables: Match.stringLikeRegexp('.*TEST_BUCKET.*BucketName.*'),
              }),
              Name: 'IntegrationTests',
            }),
          ]),
          Name: 'Staging',
        }),
      ]),
    });
  });

  test('should create a CodeBuild project for integration tests with the proper script paths for running the test', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*chmod \\+x integ-test\.sh && \./integ-test.sh.*'),
      },
      Description: Match.stringLikeRegexp('.*IntegrationTests.*'),
    });
  });

  test('should create an IAM Policy with the configured permissions for the Staging stage role', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:GetObject',
            Resource: '*',
          }),
        ]),
      },
      PolicyName: Match.stringLikeRegexp('.*CodePipelineStagingIntegrationTestsRoleDefaultPolicy.*'),
    });
  });
});

