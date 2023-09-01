// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
* Tests SparkCICDPipeline construct
*
* @group unit/spark-processing
*/

import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { SparkCICDPipeline, ApplicationStackFactory } from '../../src';


describe('With minimal configuration the construct', () => {

  const stack = new Stack();

  class MyApplicationStack extends Stack {
    constructor(scope: Stack) {
      super(scope, 'MyApplicationStack');

      new Bucket(this, 'TestBucket', {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }
  }

  class MyStackFactory implements ApplicationStackFactory {
    createStack(scope: Stack): Stack {
      return new MyApplicationStack(scope);
    }
  }

  new SparkCICDPipeline(stack, 'TestConstruct', {
    applicationName: 'test',
    applicationStackFactory: new MyStackFactory(),
  });

  const template = Template.fromStack(stack);
  console.log(JSON.stringify(template.toJSON(), null, 2));

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
    });
  });

  test('should create a synth stage with the proper cdk project default path', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*cd \..*'),
      },
    });
  });

  test('should run the unit tests with EMR 6.12 as the default', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*docker run -i --name pytest public.ecr.aws/emr-serverless/spark/emr-6.12.0:latest.*'),
      },
    });
  });

  // test('should create a CDK Pipeline that deploys stacks cross accounts', () => {
  //   template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
  //     Stages: Match.arrayWith([
  //       Match.objectLike({
  //         "Actions": Match.arrayWith([
  //           Match.objectLike({
  //             "ActionTypeId": Match.objectLike({
  //               "Category": "Deploy",
  //               "Owner": "AWS",
  //               "Provider": "CloudFormation",
  //             }),
  //             "Configuration": Match.objectLike({
  //               "StackName": "Staging-MyApplicationStack",
  //             }),
  //             "InputArtifacts": [
  //               {
  //                 "Name": "CodeBuildSynthStep_Output"
  //               }
  //             ],
  //             "Name": "Deploy",
  //           }),
  //         ]),
  //         "Name": "Staging"
  //       }),
  //     ]),
  //   });
  // });

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
                StackName: 'Staging-MyApplicationStack',
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
                StackName: 'Production-MyApplicationStack',
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

describe('With custom configuration the construct', () => {

  const stack = new Stack();

  class MyApplicationStack extends Stack {
    constructor(scope: Stack) {
      super(scope, 'MyApplicationStack');

      new Bucket(this, 'TestBucket', {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });
    }
  }

  class MyStackFactory implements ApplicationStackFactory {
    createStack(scope: Stack): Stack {
      return new MyApplicationStack(scope);
    }
  }

  new SparkCICDPipeline(stack, 'TestConstruct', {
    applicationName: 'test',
    applicationStackFactory: new MyStackFactory(),
  });

  const template = Template.fromStack(stack);
  console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a code repository', () => {
    template.resourceCountIs('AWS::CodeCommit::Repository', 1);
  });
});

