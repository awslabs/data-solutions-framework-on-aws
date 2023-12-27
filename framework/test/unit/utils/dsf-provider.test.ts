// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import path from 'path';
import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { DsfProvider } from '../../../src/utils';

/**
 * Tests DsfProvider construct
 *
 * @group unit/dsf-provider
 */

describe('With default configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myManagedPolicy = new ManagedPolicy(stack, 'Policy', {
    document: new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
            's3:*',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    }),
  });

  new DsfProvider(stack, 'Provider', {
    providerName: 'my-provider',
    onEventHandlerDefinition: {
      managedPolicy: myManagedPolicy,
      handler: 'on-event.handler',
      depsLockFilePath: path.join(__dirname, '../../resources/utils/lambda/my-cr/package-lock.json'),
      entryFile: path.join(__dirname, '../../resources/utils/lambda/my-cr/on-event.mjs'),
    },
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CloudWatch LogGroup', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup',
      Match.objectLike({
        RetentionInDays: 7,
      }),
    );
  });

  test('should create an IAM Role assumed by Lambda and with the managed policy attached', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        ManagedPolicyArns: [
          {
            Ref: Match.stringLikeRegexp('.*'),
          },
        ],
      }),
    );
  });

  test('should create an IAM policy for logging', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'logs:CreateLogStream',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('ProviderOnEventHandlerLogLogGroup.*'),
                  'Arn',
                ],
              },
            },
            {
              Action: 'logs:PutLogEvents',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': Match.arrayWith([
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('ProviderOnEventHandlerLogLogGroup.*'),
                        'Arn',
                      ],
                    },
                    ':log-stream:*',
                  ],
                ]),
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('ProviderOnEventHandlerLogPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('ProviderOnEventHandlerRole.*'),
          },
        ],
      }),
    );
  });
  test('should create a Lambda function for onEvent event', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Handler: 'on-event.handler',
        LoggingConfig: {
          LogGroup: {
            Ref: Match.stringLikeRegexp('ProviderOnEventHandlerLogLogGroup.*'),
          },
        },
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('ProviderOnEventHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
      }),
    );
  });
});

describe('With isComplete handler configuration configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const myOnEventManagedPolicy = new ManagedPolicy(stack, 'OnEventPolicy', {
    document: new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
            's3:*',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    }),
  });

  const myIsCompleteManagedPolicy = new ManagedPolicy(stack, 'IsCompletePolicy', {
    document: new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
            's3:*',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    }),
  });

  new DsfProvider(stack, 'Provider', {
    providerName: 'my-provider',
    onEventHandlerDefinition: {
      managedPolicy: myOnEventManagedPolicy,
      handler: 'on-event.handler',
      depsLockFilePath: path.join(__dirname, '../../resources/utils/lambda/my-cr/package-lock.json'),
      entryFile: path.join(__dirname, '../../resources/utils/lambda/my-cr/on-event.mjs'),
    },
    isCompleteHandlerDefinition: {
      managedPolicy: myIsCompleteManagedPolicy,
      handler: 'is-complete.handler',
      depsLockFilePath: path.join(__dirname, '../../resources/utils/lambda/my-cr/package-lock.json'),
      entryFile: path.join(__dirname, '../../resources/utils/lambda/my-cr/is-complete.mjs'),
    },
  });

  const template = Template.fromStack(stack);
  console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create another CloudWatch LogGroup for isComplete lambda', () => {
    template.resourceCountIs('AWS::Logs::LogGroup', 2);
  });

  test('should create another IAM Role assumed by Lambda and with the managed policy attached', () => {
    template.resourcePropertiesCountIs('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        ManagedPolicyArns: [
          {
            Ref: Match.stringLikeRegexp('.*'),
          },
        ],
      }), 2);
  });

  test('should create an IAM policy for isComplete lambda logging', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'logs:CreateLogStream',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('ProviderIsCompleteHandlerLogLogGroup.*'),
                  'Arn',
                ],
              },
            },
            {
              Action: 'logs:PutLogEvents',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': Match.arrayWith([
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('ProviderIsCompleteHandlerLogLogGroup.*'),
                        'Arn',
                      ],
                    },
                    ':log-stream:*',
                  ],
                ]),
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('ProviderIsCompleteHandlerLogPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('ProviderisCompleteHandlerRole.*'),
          },
        ],
      }),
    );
  });
  test('should create a Lambda function for isComplete event', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Handler: 'is-complete.handler',
        LoggingConfig: {
          LogGroup: {
            Ref: Match.stringLikeRegexp('ProviderIsCompleteHandlerLogLogGroup.*'),
          },
        },
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('ProviderisCompleteHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
      }),
    );
  });
});