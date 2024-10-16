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
                    'kafka:DeleteClusterPolicy',
                  ],
                  Effect: 'Allow',
                  Resource: '*',
                },
              ],
            }),
            PolicyName: 'IamPermissions',
          },
        ],
        RoleName: 'MskTopicAuthorizerGrantFunction',
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
        Environment: {
          Variables: {
            GRANT_VPC: 'false',
          },
        },
      }),
    );
  });

  test('should create an IAM role for the Step Functions state machine', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        RoleName: 'MskTopicAuthorizerEnvironmentStateMachine',
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
            {
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': {
                    'Fn::Join': [
                      '',
                      [
                        'arn:',
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':states:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        ':stateMachine:MskTopicAuthorizerCentral',
                      ],
                    ],
                  },
                },
              },
              Effect: 'Allow',
              Principal: {
                AWS: {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':iam::',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':root',
                    ],
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
              Action: 'states:sendTaskSuccess',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:MskTopicAuthorizerCentral',
                  ],
                ],
              },
            },
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':role/MskTopicAuthorizerCentralCallback',
                  ],
                ],
              },
            },
            {
              Action: 'states:sendTaskFailure',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:MskTopicAuthorizerCentral',
                  ],
                ],
              },
            },
            {
              Action: [
                'logs:CreateLogDelivery',
                'logs:GetLogDelivery',
                'logs:UpdateLogDelivery',
                'logs:DeleteLogDelivery',
                'logs:ListLogDeliveries',
                'logs:PutResourcePolicy',
                'logs:DescribeResourcePolicies',
                'logs:DescribeLogGroups',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
            {
              Action: 'states:StartExecution',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':states:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':stateMachine:MskTopicAuthorizerEnvironment',
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
              '","Payload.$":"$"}},"SuccessCallback":{"End":true,"Type":"Task","TimeoutSeconds":10,"ResultPath":null,"Credentials":{"RoleArn":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::',
              {
                Ref: 'AWS::AccountId',
              },
              ':role/MskTopicAuthorizerCentralCallback"},"Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::aws-sdk:sfn:sendTaskSuccess","Parameters":{"TaskToken.$":"$.TaskToken","Output.$":"$.GrantResult"}},"FailureCallback":{"Next":"EnvironmentWorkflowFailure","Type":"Task","TimeoutSeconds":10,"ResultPath":null,"Credentials":{"RoleArn":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::',
              {
                Ref: 'AWS::AccountId',
              },
              ':role/MskTopicAuthorizerCentralCallback"},"Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::aws-sdk:sfn:sendTaskFailure","Parameters":{"TaskToken.$":"$.TaskToken","Error.$":"$.ErrorInfo.Error","Cause.$":"$.ErrorInfo.Cause"}},"EnvironmentWorkflowFailure":{"Type":"Fail","ErrorPath":"$.ErrorInfoError","CausePath":"$.ErrorInfo.Cause"}},"TimeoutSeconds":120}',
            ],
          ],
        },
        RoleArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerStateMachineRole.*'),
            'Arn',
          ],
        },
        StateMachineName: 'MskTopicAuthorizerEnvironment',
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

});