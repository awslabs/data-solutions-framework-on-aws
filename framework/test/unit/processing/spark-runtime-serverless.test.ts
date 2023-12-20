// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests Spark runtime EMR Serverless construct
 *
 * @group unit/processing-runtime/serverless/emr-serverless
*/


import { Stack, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AccountRootPrincipal, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { EmrRuntimeVersion, SparkEmrServerlessRuntime } from '../../../src/processing';

describe('Create an EMR Serverless Application with runtime configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const runtimeServerless = new SparkEmrServerlessRuntime(stack, 'SparkRuntimeServerlessStack', {
    releaseLabel: EmrRuntimeVersion.V6_15,
    name: 'spark-serverless-demo',
    runtimeConfiguration: [{classification: "spark-defaults", properties: {"spark.driver.cores": "4"}}]
  });

  const template = Template.fromStack(stack);

  test('EMR Serverless application created with default config', () => {
    template.hasResource('AWS::EMRServerless::Application',
      Match.objectLike({
        Properties: {
          RuntimeConfiguration: [{classification: "spark-defaults", properties: {"spark.driver.cores": "4"}}],
        },
      }),
    );
  });
})


describe('Create an EMR Serverless Application for Spark and grant access', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const runtimeServerless = new SparkEmrServerlessRuntime(stack, 'SparkRuntimeServerlessStack', {
    releaseLabel: EmrRuntimeVersion.V6_12,
    name: 'spark-serverless-demo',
  });

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });

  let myTestRole = new Role (stack, 'TestRole', {
    assumedBy: new AccountRootPrincipal(),
  });

  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

  runtimeServerless.grantStartExecution(myTestRole, myExecutionRole.roleArn);

  const template = Template.fromStack(stack);

  test('EMR Serverless application created with Type of Spark', () => {
    template.hasResource('AWS::EMRServerless::Application',
      Match.objectLike({
        Properties: {
          ReleaseLabel: Match.stringLikeRegexp('emr-*'),
          Type: 'Spark',
        },
      }),
    );
  });

  test('Check a VPC is created when no network configuration is created', () => {
    template.hasResource('AWS::EC2::VPC',
      Match.objectLike({
        Properties: {
          CidrBlock: Match.stringLikeRegexp('10.0.0.0/16'),
        },
      }),
    );
  });

  test('Static methods create the right role and policy scoped to passrole', () => {
    template.hasResource('AWS::IAM::Policy',
      Match.objectLike({
        Properties: {
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'iam:PassRole',
                Condition: {
                  StringLike: {
                    'iam:PassedToService': 'emr-serverless.amazonaws.com',
                  },
                },
                Resource: { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
              },
              {
                Effect: 'Allow',
                Action: [
                  'emr-serverless:StartApplication',
                  'emr-serverless:StopApplication',
                  'emr-serverless:StopJobRun',
                  'emr-serverless:DescribeApplication',
                  'emr-serverless:GetJobRun',
                ],
                Resource: {
                  'Fn::GetAtt': ['sparkserverlessapplicationsparkserverlessdemo', 'Arn'],
                },
              },
              {
                Effect: 'Allow',
                Action: 'emr-serverless:StartJobRun',
                Resource: {
                  'Fn::GetAtt': ['sparkserverlessapplicationsparkserverlessdemo', 'Arn'],
                },
              },
              {
                Effect: 'Allow',
                Action: 'emr-serverless:TagResource',
                Resource: {
                  'Fn::GetAtt': ['sparkserverlessapplicationsparkserverlessdemo', 'Arn'],
                },
              },
            ],
          },
        },
      }),
    );
  });

  test('Test for execution role', () => {
    template.hasResource('AWS::IAM::Role',
      Match.objectLike({
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: {
                  Service: 'emr-serverless.amazonaws.com',
                },
              },
            ],
          },
        },
      }),
    );
  });

});


describe('Test static methods', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  let myTestRole = new Role (stack, 'TestRole', {
    assumedBy: new AccountRootPrincipal(),
  });

  const myFileSystemPolicy = new PolicyDocument({
    statements: [new PolicyStatement({
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    })],
  });

  const myExecutionRole = SparkEmrServerlessRuntime.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

  SparkEmrServerlessRuntime.grantStartJobExecution(myTestRole, [myExecutionRole.roleArn], ['emr-serverless-app-id']);

  const template = Template.fromStack(stack);

  test('Static methods create the right role and policy scoped to passrole', () => {
    template.hasResource('AWS::IAM::Policy',
      Match.objectLike({
        Properties: {
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'iam:PassRole',
                Condition: {
                  StringLike: {
                    'iam:PassedToService': 'emr-serverless.amazonaws.com',
                  },
                },
                Resource: { 'Fn::GetAtt': ['execRole1F3395738', 'Arn'] },
              },
              {
                Effect: 'Allow',
                Action: [
                  'emr-serverless:StartApplication',
                  'emr-serverless:StopApplication',
                  'emr-serverless:StopJobRun',
                  'emr-serverless:DescribeApplication',
                  'emr-serverless:GetJobRun',
                ],
                Resource: 'emr-serverless-app-id',
              },
              {
                Effect: 'Allow',
                Action: 'emr-serverless:StartJobRun',
                Resource: 'emr-serverless-app-id',
              },
              {
                Effect: 'Allow',
                Action: 'emr-serverless:TagResource',
                Resource: 'emr-serverless-app-id',
              },
            ],
          },
        },
      }),
    );
  });

});
