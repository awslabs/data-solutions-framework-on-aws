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
import { SparkRuntimeServerless } from '../../../src/processing-runtime';
import { EmrVersion } from '../../../src/utils';


describe('Create an EMR Serverless Application for Spark and grant access', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const runtimeServerless = new SparkRuntimeServerless(stack, 'SparkRuntimeServerlessStack', {
    releaseLabel: EmrVersion.V6_12,
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

  const myExecutionRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

  runtimeServerless.grantExecution(myTestRole, myExecutionRole.roleArn);

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
                  'emr-serverless:StartJobRun',
                  'emr-serverless:StopJobRun',
                  'emr-serverless:DescribeApplication',
                  'emr-serverless:GetJobRun',
                ],
                Resource: {
                  'Fn::GetAtt': ['SparkRuntimeServerlessStacksparkserverlessapplicationsparkserverlessdemo0CABFE2A', 'Arn'],
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

  const myExecutionRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

  SparkRuntimeServerless.grantJobExecution(myTestRole, [myExecutionRole.roleArn], ['emr-serverless-app-id']);

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
                  'emr-serverless:StartJobRun',
                  'emr-serverless:StopJobRun',
                  'emr-serverless:DescribeApplication',
                  'emr-serverless:GetJobRun',
                ],
                Resource: 'emr-serverless-app-id',
              },
            ],
          },
        },
      }),
    );
  });

});
