// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataZoneMskCentralAuthorizer construct
 *
 * @group unit/datazone/datazone-msk-central-authorizer
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataZoneMskCentralAuthorizer } from '../../../src/governance';


describe ('Creating a DataZoneMskCentralAuthorizer with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  const centralAuthorizer = new DataZoneMskCentralAuthorizer(stack, 'MskAuthorizer', {
    domainId: DOMAIN_ID,
  });

  centralAuthorizer.registerAccount('999999999999');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('should create an IAM role for the metadata collector function with proper DataZone permissions ', () => {
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
                    'datazone:GetListing',
                    'datazone:GetEnvironment',
                    'datazone:GetSubscriptionTarget',
                    'datazone:UpdateSubscriptionGrantStatus',
                  ],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::Join': Match.arrayWith([
                      Match.arrayWith([
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':datazone:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        `:domain/${DOMAIN_ID}`,
                      ]),
                    ]),
                  },
                },
              ],
            }),
            PolicyName: 'DataZonePermissions',
          },
        ],
      }),
    );
  });

  test('should create a Lambda function for the metadata collector', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerMetadataCollectorHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 30,
      }),
    );
  });

  test('should create an IAM role for the callback function with proper datazone permissions ', () => {
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
                  Action: 'datazone:UpdateSubscriptionGrantStatus',
                  Effect: 'Allow',
                  Resource: {
                    'Fn::Join': Match.arrayWith([
                      Match.arrayWith([
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':datazone:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        `:domain/${DOMAIN_ID}`,
                      ]),
                    ]),
                  },
                },
              ],
            }),
            PolicyName: 'DataZonePermissions',
          },
        ],
      }),
    );
  });

  test('should create a Lambda function for the DataZone callback function', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerCallbackHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 30,
      }),
    );
  });

  test('should create an Event Bridge event rule for DataZone events', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          'source': [
            'aws.datazone',
          ],
          'detail-type': [
            'Subscription Grant Requested',
            'Subscription Grant Revoke Requested',
          ],
          'detail': {
            metadata: {
              domain: [
                DOMAIN_ID,
              ],
            },
            data: {
              asset: {
                typeName: [
                  'MskTopicAssetType',
                ],
              },
            },
          },
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
                Match.stringLikeRegexp('MskAuthorizerSourceEventRole.*'),
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
        PolicyName: Match.stringLikeRegexp('MskAuthorizerSourceEventRoleDefaultPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('MskAuthorizerSourceEventRole.*'),
          },
        ],
      }),
    );
  });

  test('should create an Event Bridge event rule for the authorizer callback events', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          'source': [
            'dsf.MskTopicAuthorizer',
          ],
          'detail-type': [
            'callback',
          ],
        },
        State: 'ENABLED',
        Targets: [
          Match.objectLike({
            Arn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('MskAuthorizerCallbackFunction.*'),
                'Arn',
              ],
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
              MaximumEventAgeInSeconds: 3600,
              MaximumRetryAttempts: 10,
            },
          }),
        ],
      }),
    );
  });

  test('should create Lambda function permissions for calling back', () => {
    template.hasResourceProperties('AWS::Lambda::Permission',
      Match.objectLike({
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerCallbackFunction.*'),
            'Arn',
          ],
        },
        Principal: 'events.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerCallbackEventRule.*'),
            'Arn',
          ],
        },
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

  test('should attach proper permissions to the state machine role', () => {
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
                    Match.stringLikeRegexp('MskAuthorizerMetadataCollectorHandler.*'),
                    'Arn',
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': [
                          Match.stringLikeRegexp('MskAuthorizerMetadataCollectorHandler.*'),
                          'Arn',
                        ],
                      },
                      ':*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: 'eventbridge:putEvents',
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:events:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':event-bus/default',
                  ],
                ],
              },
            },
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::GetAtt': [
                    'MskAuthorizerCallbackHandler948D9927',
                    'Arn',
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': [
                          'MskAuthorizerCallbackHandler948D9927',
                          'Arn',
                        ],
                      },
                      ':*',
                    ],
                  ],
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
                    ':999999999999:event-bus/default',
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
              '{"StartAt":"MetadataCollector","States":{"MetadataCollector":{"Next":"ProducerGrantEventBridgePutEvents","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Catch":[{"ErrorEquals":["States.TaskFailed"],"ResultPath":"$.ErrorInfo","Next":"GovernanceFailureCallback"}],"Type":"Task","TimeoutSeconds":120,"ResultSelector":{"Metadata.$":"$.Payload"},"Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::lambda:invoke","Parameters":{"FunctionName":"',
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerMetadataCollectorHandler.*'),
                  'Arn',
                ],
              },
              '","Payload.$":"$"}},"ProducerGrantEventBridgePutEvents":{"Next":"ConsumerGrantEventBridgePutEvents","Catch":[{"ErrorEquals":["States.TaskFailed"],"ResultPath":"$.ErrorInfo","Next":"GovernanceFailureCallback"}],"Type":"Task","TimeoutSeconds":300,"ResultPath":null,"Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ":states:::aws-sdk:eventbridge:putEvents.waitForTaskToken\",\"Parameters\":{\"Entries\":[{\"Detail\":{\"type\":1,\"value\":{\"TaskToken.$\":\"$$.Task.Token\",\"Metadata.$\":\"$.Metadata\"}},\"DetailType\":\"producerGrant\",\"Source\":\"dsf.MskTopicAuthorizer\",\"EventBusName.$\":\"States.Format('arn:aws:events:{}:{}:event-bus/default', $.Metadata.Producer.Region, $.Metadata.Producer.Account)\"}]}},\"ConsumerGrantEventBridgePutEvents\":{\"Next\":\"GovernanceSuccessCallback\",\"Catch\":[{\"ErrorEquals\":[\"States.TaskFailed\"],\"ResultPath\":\"$.ErrorInfo\",\"Next\":\"GovernanceFailureCallback\"}],\"Type\":\"Task\",\"TimeoutSeconds\":300,\"ResultPath\":null,\"Resource\":\"arn:",
              {
                Ref: 'AWS::Partition',
              },
              ":states:::aws-sdk:eventbridge:putEvents.waitForTaskToken\",\"Parameters\":{\"Entries\":[{\"Detail\":{\"type\":1,\"value\":{\"TaskToken.$\":\"$$.Task.Token\",\"Metadata.$\":\"$.Metadata\"}},\"DetailType\":\"consumerGrant\",\"Source\":\"dsf.MskTopicAuthorizer\",\"EventBusName.$\":\"States.Format('arn:aws:events:{}:{}:event-bus/default', $.Metadata.Consumer.Region, $.Metadata.Consumer.Account)\"}]}},\"GovernanceSuccessCallback\":{\"End\":true,\"Retry\":[{\"ErrorEquals\":[\"Lambda.ClientExecutionTimeoutException\",\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Type\":\"Task\",\"TimeoutSeconds\":60,\"Resource\":\"arn:",
              {
                Ref: 'AWS::Partition',
              },
              ':states:::lambda:invoke","Parameters":{"FunctionName":"',
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerCallbackHandler.*'),
                  'Arn',
                ],
              },
              '","Payload":{"Status":"success","Metadata.$":"$.Metadata"}}},"GovernanceFailureCallback":{"Next":"CentralWorfklowFailure","Retry":[{"ErrorEquals":["Lambda.ClientExecutionTimeoutException","Lambda.ServiceException","Lambda.AWSLambdaException","Lambda.SdkClientException"],"IntervalSeconds":2,"MaxAttempts":6,"BackoffRate":2}],"Type":"Task","TimeoutSeconds":60,"Resource":"arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':states:::lambda:invoke","Parameters":{"FunctionName":"',
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('MskAuthorizerCallbackHandler.*'),
                  'Arn',
                ],
              },
              '","Payload":{"Status":"failure","Metadata.$":"$.Metadata","Error.$":"$.ErrorInfo.Error","Cause.$":"$.ErrorInfo.Cause"}}},"CentralWorfklowFailure":{"Type":"Fail","ErrorPath":"$.ErrorInfo"}},"TimeoutSeconds":300}',
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
                      Match.stringLikeRegexp('MskAuthorizerAuthorizerEventRule.*'),
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
            Match.objectLike({
              Action: 'sqs:SendMessage',
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': {
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('MskAuthorizerCallbackEventRule.*'),
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

  test('should create an IAM Role for the callback Lambda function', () => {
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
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      }),
    );
  });

  test('should create an IAM policy for the callback Lambda function', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: [
                'states:SendTaskSuccess',
                'states:SendTaskFailure',
              ],
              Effect: 'Allow',
              Resource: {
                Ref: Match.stringLikeRegexp('MskAuthorizerStateMachine.*'),
              },
            },
            {
              Action: [
                'states:SendTaskSuccess',
                'states:SendTaskFailure',
                'states:SendTaskHeartbeat',
              ],
              Effect: 'Allow',
              Resource: {
                Ref: Match.stringLikeRegexp('MskAuthorizerStateMachine.*'),
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('MskAuthorizerLambdaCallbackRoleDefaultPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('MskAuthorizerLambdaCallbackRole.*'),
          },
        ],
      }),
    );
  });

  test('should create a callback Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('MskAuthorizerLambdaCallbackRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 5,
      }),
    );
  });

});

describe ('Creating a DataZoneMskCentralAuthorizer with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneMskCentralAuthorizer(stack, 'MskAuthorizer', {
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

describe ('Creating a DataZoneMskCentralAuthorizer with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new DataZoneMskCentralAuthorizer(stack, 'MskAuthorizer', {
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