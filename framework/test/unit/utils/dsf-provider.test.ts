// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { DsfProvider } from '../../../src/utils/lib/dsf-provider';

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

  test('Lambda must have a resource policy for allowing an invoke', () => {
    template.hasResourceProperties('AWS::Lambda::Permission',
      Match.objectLike({
        FunctionName: {
          'Fn::GetAtt': ['ProviderOnEventHandlerFunctionB0717C76', 'Arn'],
        },
        Principal: 'lambda.amazonaws.com',
        Action: 'lambda:InvokeFunction',
        SourceArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('ProviderCustomResourceProviderframeworkonEvent.*'), 'Arn'] },
      }),
    );
  });

  test('Lambda have only 1 resource permission', () => {
    template.resourceCountIs('AWS::Lambda::Permission', 1);
  });

  test('should set proper log retention for the custom resource', () => {
    template.resourcePropertiesCountIs('Custom::LogRetention', {
      RetentionInDays: 7,
    }, 1);
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
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('ProviderOnEventHandlerLogGroup.*'),
                  'Arn',
                ],
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('ProviderOnEventHandlerRoleDefaultPolicy.*'),
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
            Ref: Match.stringLikeRegexp('ProviderOnEventHandlerLogGroup.*'),
          },
        },
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('ProviderOnEventHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 840,
      }),
    );
  });

  test('should set the timeout to 30 minutes', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Handler: 'framework.onEvent',
        Timeout: 900,
      }),
    );
  });
});

describe('With removal policy set to DESTROY and the global removal policy parameter unset, the construct ', () => {

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
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CloudWatch LogGroup', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe('With removal policy set to DESTROY and the global removal policy parameter set to TRUE, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

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
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CloudWatch LogGroup', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('should set the timeout to 30 minutes', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Handler: 'framework.onEvent',
        Timeout: 900,
      }),
    );
  });
});

describe('With removal policy set to DESTROY and the global removal policy parameter unset, the construct ', () => {

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
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CloudWatch LogGroup', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe('With removal policy set to DESTROY and the global removal policy parameter set to TRUE, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

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
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a CloudWatch LogGroup', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
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
  // console.log(JSON.stringify(template.toJSON(), null, 2));

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
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('ProviderIsCompleteHandlerLogGroup.*'),
                  'Arn',
                ],
              },
            },
          ],
        }),
        PolicyName: Match.stringLikeRegexp('ProviderIsCompleteHandlerRoleDefaultPolicy.*'),
        Roles: [
          {
            Ref: Match.stringLikeRegexp('ProviderIsCompleteHandlerRole.*'),
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
            Ref: Match.stringLikeRegexp('ProviderIsCompleteHandlerLogGroup.*'),
          },
        },
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('ProviderIsCompleteHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 840,
      }),
    );
  });
});

describe('With custom configuration, the construct should', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const vpc = new Vpc(stack, 'Vpc');

  const securityGroup = new SecurityGroup(stack, 'SecurityGroup', {
    vpc,
    allowAllOutbound: true,
  });

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
      timeout: Duration.seconds(5),
    },
    isCompleteHandlerDefinition: {
      managedPolicy: myIsCompleteManagedPolicy,
      handler: 'is-complete.handler',
      depsLockFilePath: path.join(__dirname, '../../resources/utils/lambda/my-cr/package-lock.json'),
      entryFile: path.join(__dirname, '../../resources/utils/lambda/my-cr/is-complete.mjs'),
      timeout: Duration.seconds(5),
    },
    queryInterval: Duration.seconds(10),
    queryTimeout: Duration.seconds(120),
    vpc,
    securityGroups: [securityGroup],
    subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('Lambda have exactly 2 resource permission', () => {
    template.resourceCountIs('AWS::Lambda::Permission', 2);
  });

  test('should create a managed policy with ENI permissions', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            {
              Action: 'ec2:DescribeNetworkInterfaces',
              Condition: {
                StringEquals: {
                  'aws:RequestedRegion': {
                    Ref: 'AWS::Region',
                  },
                },
              },
              Effect: 'Allow',
              Resource: '*',
            },
            {
              Action: [
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses',
              ],
              Condition: {
                StringEqualsIfExists: {
                  'ec2:Subnet': [
                    {
                      'Fn::Join': Match.arrayWith([
                        Match.arrayWith([
                          {
                            Ref: Match.stringLikeRegexp('VpcPrivateSubnet1Subnet.*'),
                          },
                        ]),
                      ]),
                    },
                    {
                      'Fn::Join': Match.arrayWith([
                        Match.arrayWith([
                          {
                            Ref: Match.stringLikeRegexp('VpcPrivateSubnet2Subnet.*'),
                          },
                        ]),
                      ]),
                    },
                  ],
                },
              },
              Effect: 'Allow',
              Resource: '*',
            },
            {
              Action: 'ec2:CreateNetworkInterface',
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        Ref: 'AWS::Region',
                      },
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':network-interface/*',
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        Ref: Match.stringLikeRegexp('VpcPrivateSubnet1Subnet.*'),
                      },
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        Ref: Match.stringLikeRegexp('VpcPrivateSubnet2Subnet.*'),
                      },
                    ]),
                  ]),
                },
                {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        'Fn::GetAtt': [
                          Match.stringLikeRegexp('SecurityGroup.*'),
                          'GroupId',
                        ],
                      },
                    ]),
                  ]),
                },
              ],
            },
          ]),
        }),
      }),
    );
  });

  test('should create an isComplete check every 10 seconds', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine',
      Match.objectLike({
        DefinitionString: {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*IntervalSeconds"\:10.*'),
            ]),
          ]),
        },
      }),
    );
  });

  test('should create customized lambda function for isComplete', () => {
    template.hasResource('AWS::Lambda::Function',
      Match.objectLike({
        Properties: Match.objectLike({
          Role: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('ProviderIsCompleteHandlerRole.*'),
              'Arn',
            ],
          },
          Runtime: 'nodejs20.x',
          Timeout: 5,
          VpcConfig: {
            SecurityGroupIds: [
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('SecurityGroup.*'),
                  'GroupId',
                ],
              },
            ],
            SubnetIds: [
              {
                Ref: Match.stringLikeRegexp('VpcPrivateSubnet1Subnet.*'),
              },
              {
                Ref: Match.stringLikeRegexp('VpcPrivateSubnet2Subnet.*'),
              },
            ],
          },
        }),
        DependsOn: Match.arrayWith([
          Match.stringLikeRegexp('ProviderCleanUpCustomResource.*'),
        ]),
      }),
    );
  });

  test('should create customized lambda function for onEvent', () => {
    template.hasResource('AWS::Lambda::Function',
      Match.objectLike({
        Properties: Match.objectLike({
          Role: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('ProviderOnEventHandlerRole.*'),
              'Arn',
            ],
          },
          Runtime: 'nodejs20.x',
          Timeout: 5,
          VpcConfig: {
            SecurityGroupIds: [
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('SecurityGroup.*'),
                  'GroupId',
                ],
              },
            ],
            SubnetIds: [
              {
                Ref: Match.stringLikeRegexp('VpcPrivateSubnet1Subnet.*'),
              },
              {
                Ref: Match.stringLikeRegexp('VpcPrivateSubnet2Subnet.*'),
              },
            ],
          },
        }),
        DependsOn: Match.arrayWith([
          Match.stringLikeRegexp('ProviderCleanUpCustomResource.*'),
        ]),
      }),
    );
  });

  test('should create a lambda function for ENI cleanup custom resource', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: {
            SECURITY_GROUPS: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('SecurityGroup.*'),
                'GroupId',
              ],
            },
            SUBNETS: {
              'Fn::Join': Match.arrayWith([
                Match.arrayWith([
                  {
                    Ref: Match.stringLikeRegexp('VpcPrivateSubnet1Subnet.*'),
                  },
                  {
                    Ref: Match.stringLikeRegexp('VpcPrivateSubnet2Subnet.*'),
                  },
                ]),
              ]),
            },
          },
        },
        Handler: 'index.handler',
        LoggingConfig: {
          LogGroup: {
            Ref: Match.stringLikeRegexp('ProviderCleanUpLogGroup.*'),
          },
        },
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('ProviderCleanUpRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 120,
      }),
    );
  });

  test('should create an IAM role for the ENI cleanup custom resource', () => {
    template.hasResource('AWS::IAM::Role',
      Match.objectLike({
        Properties: {
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
              Ref: Match.stringLikeRegexp('ProviderVpcPolicy.*'),
            },
          ],
        },
        DependsOn: [
          Match.stringLikeRegexp('ProviderVpcPolicy.*'),
        ],
      }),
    );
  });

  test('should create a CloudWatch Log Group for the CleanUp custom resource', () => {
    template.resourcePropertiesCountIs('AWS::Logs::LogGroup',
      Match.objectLike({
        RetentionInDays: 7,
      })
      , 3 );
  });
});