// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataZoneMskEnvironmentAuthorizer construct
 *
 * @group unit/datazone/datazone-msk-environment-authorizer
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataZoneMskEnvironmentAuthorizer } from '../../../src/governance';


describe ('Creating a DataZoneMskEnvironmentAuthorizer with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneMskEnvironmentAuthorizer(stack, 'MskAuthorizer', {
    domainId: DOMAIN_ID,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('should create an IAM role for the Lambda function creating the grants', () => {
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
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ]),
            ]),
          },
        ],
        Policies: [
          {
            PolicyDocument: Match.objectLike({
              Statement: [
                {
                  Action: [
                    'iam:PutRolePolicy',
                    'iam:DeleteRolePolicy',
                  ],
                  Effect: 'Allow',
                  Resource: '*',
                },
                {
                  Action: [
                    'kafka:GetClusterPolicy',
                    'kafka:PutClusterPolicy',
                  ],
                  Effect: 'Allow',
                  Resource: '*',
                },
              ],
            }),
            PolicyName: 'IamPermissions',
          },
        ],
      }),
    );
  });

  test('should create a Lambda function for creating the grants', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerGrantRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 60,
      }),
    );
  });


  test('should create an Event Bridge event rule for central authorizer events', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          'source': [
            'dsf.MskTopicAuthorizer',
          ],
          'detail-type': [
            'producerGrant',
            'consumerGrant',
          ],
        },
        State: 'ENABLED',
        Targets: [
          Match.objectLike({
            Arn: {
              Ref: Match.stringLikeRegexp('MskAuthorizerStateMachine.*'),
            },
            DeadLetterConfig: {
              Arn: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerQueue.*'),
                  'Arn',
                ],
              },
            },
            RetryPolicy: {
              MaximumRetryAttempts: 0,
            },
            RoleArn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('MskAuthorizerCentralEventRole.*'),
                'Arn',
              ],
            },
          }),
        ],
      }),
    );
  });

  test('should create an IAM role for triggering the authorizer Step Functions state machine', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
            },
          ],
        }),
      }),
    );
  });

  test('should attach proper permissions to the event rule role to trigger the state machine', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'states:StartExecution',
              Effect: 'Allow',
              Resource: {
                Ref: Match.stringLikeRegexp('MskAuthorizerStateMachine.*'),
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('MskAuthorizerCentralEventRoleDefaultPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('MskAuthorizerCentralEventRole.*'),
          },
        ],
      }),
    );
  });

  test('should create an IAM role for the Step Functions state machine', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: {
                  'Fn::FindInMap': [
                    'ServiceprincipalMap',
                    {
                      Ref: 'AWS::Region',
                    },
                    'states',
                  ],
                },
              },
            },
          ],
        }),
      }),
    );
  });

  test('should create proper IAM policy for the Step Functions state machine', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('MskAuthorizerGrantFunction.*'),
                    'Arn',
                  ],
                },
                {
                  'Fn::Join': Match.arrayWith([
                    [
                      {
                        'Fn::GetAtt': [
                          Match.stringLikeRegexp('MskAuthorizerGrantFunction.*'),
                          'Arn',
                        ],
                      },
                      ':*',
                    ],
                  ]),
                },
              ],
            },
            {
              Action: 'events:PutEvents',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':events:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':event-bus/default',
                  ],
                ],
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('MskAuthorizerStateMachineRoleDefaultPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('MskAuthorizerStateMachineRole.*'),
          },
        ],
      }),
    );
  });

  test('should create the Step Functions state machine', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine',
      Match.objectLike({
        DefinitionString: {
          'Fn::Join': [
            '',
            [
              '{"StartAt":"GrantInvoke","States":{"GrantInvoke":{"Next":"SuccessCallback","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Catch":[{"ErrorEquals":["States.TaskFailed"],"ResultPath":"$.ErrorInfo","Next":"FailureCallback"}],"Type":"Task","TimeoutSeconds":120,"ResultPath":"$.GrantResult","Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::lambda:invoke","Parameters":{"FunctionName":"',
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerGrantFunction.*'),
                  'Arn',
                ],
              },
              '","Payload.$":"$"}},"SuccessCallback":{"End":true,"Type":"Task","Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::events:putEvents","Parameters":{"Entries":[{"Detail":{"TaskToken.$":"$.detail.value.TaskToken","Status":"success"},"DetailType":"callback","EventBusName":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':events:',
              {
                Ref: 'AWS::Region',
              },
              ':',
              {
                Ref: 'AWS::AccountId',
              },
              ':event-bus/default","Source":"dsf.MskTopicAuthorizer"}]}},"FailureCallback":{"End":true,"Type":"Task","Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::events:putEvents","Parameters":{"Entries":[{"Detail":{"TaskToken.$":"$.detail.value.TaskToken","Status":"failure","Error.$":"$.ErrorInfo.Error","Cause.$":"$.ErrorInfo.Cause"},"DetailType":"callback","EventBusName":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':events:',
              {
                Ref: 'AWS::Region',
              },
              ':',
              {
                Ref: 'AWS::AccountId',
              },
              ':event-bus/default","Source":"dsf.MskTopicAuthorizer"}]}}},"TimeoutSeconds":120}',
            ],
          ],
        },
        RoleArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerStateMachineRole.*'),
            'Arn',
          ],
        },
      }),
    );
  });

  test('should create an SAS queue as a dead letter queue for events', () => {
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  test('should create proper IAM policy for the dead letter queue ', () => {
    template.hasResourceProperties('AWS::SQS::QueuePolicy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sqs:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerQueue.*'),
                  'Arn',
                ],
              },
            },
            Match.objectLike({
              Action: 'sqs:SendMessage',
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': {
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('MskAuthorizerCentralEventRule.*'),
                      'Arn',
                    ],
                  },
                },
              },
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerQueue.*'),
                  'Arn',
                ],
              },
            }),
          ],
        }),
        Queues: [
          {
            Ref: Match.stringLikeRegexp('MskAuthorizerQueue.*'),
          },
        ],
      }),
    );
  });


});

describe ('Creating a DataZoneMskEnvironmentAuthorizer with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneMskEnvironmentAuthorizer(stack, 'MskAuthorizer', {
    domainId: DOMAIN_ID,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create a Step Functions state machine with RETAIN removal policy', () => {
    template.hasResource('AWS::StepFunctions::StateMachine',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('should create an SQS Queue with RETAIN removal policy', () => {
    template.hasResource('AWS::SQS::Queue',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe ('Creating a DataZoneMskEnvironmentAuthorizer with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new DataZoneMskEnvironmentAuthorizer(stack, 'MskAuthorizer', {
    domainId: DOMAIN_ID,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create a Step Functions state machine with RETAIN removal policy', () => {
    template.hasResource('AWS::StepFunctions::StateMachine',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('should create an SQS Queue with RETAIN removal policy', () => {
    template.hasResource('AWS::SQS::Queue',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});