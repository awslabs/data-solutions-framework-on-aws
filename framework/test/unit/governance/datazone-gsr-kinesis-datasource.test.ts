// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests DataZoneGsrKinesisDataSource construct
 *
 * @group unit/datazone/datazone-gsr-kinesis-datasource
 */

import { App, Stack } from 'aws-cdk-lib';

import { Match, Template } from 'aws-cdk-lib/assertions';

import { Schedule } from 'aws-cdk-lib/aws-events';
import { DataZoneGsrKinesisDataSource } from '../../../src/governance';

describe('Creating a DataZone-GSR-Kinesis-Datasource with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';
  const REGISTRY_NAME = 'schema-registry';
  const PROJECT_ID = '999a99aa9aaaaa';
  const PARAMETER_PREFIX = `/datazone/${DOMAIN_ID}/${REGISTRY_NAME}/asset/`;

  new DataZoneGsrKinesisDataSource(stack, 'DataZoneGsrKinesisDataSource', {
    domainId: DOMAIN_ID,
    projectId: PROJECT_ID,
    registryName: REGISTRY_NAME,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a the following resources', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::IAM::Role', 1);
    template.resourceCountIs('AWS::DataZone::ProjectMembership', 1);

  });

  test('should create Lambda IAM Role', () => {
    // Validate the IAM Role properties
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'DataZonePermission',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: [
                    'datazone:CreateAsset',
                    'datazone:CreateAssetType',
                    'datazone:CreateFormType',
                    'datazone:GetAssetType',
                    'datazone:GetFormType',
                    'datazone:GetAsset',
                    'datazone:CreateAssetRevision',
                    'datazone:DeleteAsset',
                  ],
                  Effect: 'Allow',
                  Resource: [
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:datazone:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          `:domain/${DOMAIN_ID}`,
                        ],
                      ],
                    },
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:datazone:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          `:project/${PROJECT_ID}`,
                        ],
                      ],
                    },
                  ],
                }),
                Match.objectLike({
                  Action: [
                    'glue:GetSchemaVersion',
                    'glue:ListSchemas',
                    'glue:ListSchemaVersions',
                  ],
                  Effect: 'Allow',
                  Resource: [
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:glue:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          `:registry/${REGISTRY_NAME}`,
                        ],
                      ],
                    },
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:glue:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          `:schema/${REGISTRY_NAME}/*`,
                        ],
                      ],
                    },
                  ],
                }),
                Match.objectLike({
                  Action: [
                    'ssm:GetParameter',
                    'ssm:PutParameter',
                    'ssm:DeleteParameter',
                    'ssm:GetParametersByPath',
                  ],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::Join': [
                      '',
                      [
                        'arn:aws:ssm:',
                        { Ref: 'AWS::Region' },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        `:parameter${PARAMETER_PREFIX}*`,
                      ],
                    ],
                  },
                }),
              ]),
              Version: '2012-10-17',
            },
          }),
        ]),
      }),
    );
  });

  test('should create a default DataZone project membership', () => {
    template.hasResourceProperties('AWS::DataZone::ProjectMembership',
      Match.objectLike({
        Designation: 'PROJECT_CONTRIBUTOR',
        DomainIdentifier: DOMAIN_ID,
        Member: {
          UserIdentifier: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('DataZoneGsrKinesisDataSourceHandlerRole.*'),
              'Arn',
            ],
          },
        },
        ProjectIdentifier: PROJECT_ID,
      }),
    );
  });

  test('should create Lambda Function with correct properties', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: {
            DOMAIN_ID: DOMAIN_ID,
            PROJECT_ID: PROJECT_ID,
            REGION: { Ref: 'AWS::Region' },
            REGISTRY_NAME: REGISTRY_NAME,
            ACCOUNT_ID: { Ref: 'AWS::AccountId' },
            PARAMETER_PREFIX: PARAMETER_PREFIX,
          },
        },
        Handler: 'index.handler',
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSourceHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 300,
      }),
    );
  });

});

describe('Creating a DataZone-GSR-Kinesis-Datasource with GSR Events and Scheduled configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';
  const REGISTRY_NAME = 'schema-registry';
  const PROJECT_ID = '999a99aa9aaaaa';

  new DataZoneGsrKinesisDataSource(stack, 'DataZoneGsrKinesisDataSource', {
    domainId: DOMAIN_ID,
    projectId: PROJECT_ID,
    registryName: REGISTRY_NAME,
    enableSchemaRegistryEvent: true,
    eventBridgeSchedule: Schedule.cron({ minute: '0', hour: '12' }),
  });

  const template = Template.fromStack(stack);
  //console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a the following resources', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::IAM::Role', 1);
    template.resourceCountIs('AWS::DataZone::ProjectMembership', 1);
    template.resourceCountIs('AWS::Events::Rule', 4);
    template.resourceCountIs('AWS::Lambda::Permission', 4);
  });

  test('should create EventBridge Rule with correct properties', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        ScheduleExpression: 'cron(0 12 * * ? *)',
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
                'Arn',
              ],
            },
            Id: Match.stringLikeRegexp('Target.*'),
          }),
        ]),
      }),
    );
  });

  test('should create EventBridge Rule for Glue Schema Registry with correct properties', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          source: [
            'aws.glue',
          ],
          detail: {
            eventSource: [
              'glue.amazonaws.com',
            ],
            eventName: [
              'CreateSchema',
            ],
            responseElements: {
              registryName: [
                REGISTRY_NAME,
              ],
            },
          },
        },
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
                'Arn',
              ],
            },
            Id: Match.stringLikeRegexp('Target.*'),
            Input: `{"registryName":"${REGISTRY_NAME}"}`, // Correct escaping and format
          }),
        ]),
      }),
    );
  });

  test('should create Lambda Permission for EventBridge SchemaRegistryEventRule with correct properties', () => {
    template.hasResourceProperties('AWS::Lambda::Permission',
      Match.objectLike({
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
            'Arn',
          ],
        },
        Principal: 'events.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
            'Arn',
          ],
        },
      }),
    );
  });


  test('should create EventBridge Rule for Glue RegisterSchemaVersion with correct properties', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          source: [
            'aws.glue',
          ],
          detail: {
            eventSource: [
              'glue.amazonaws.com',
            ],
            eventName: [
              'RegisterSchemaVersion',
            ],
            requestParameters: {
              schemaId: {
                registryName: [
                  REGISTRY_NAME, // Dynamic constant for schema registry name
                ],
              },
            },
          },
        },
        Name: 'RegisterSchemaVersionRule',
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
                'Arn',
              ],
            },
            Id: Match.stringLikeRegexp('Target.*'),
            Input: `{"registryName":"${REGISTRY_NAME}"}`, // Correct dynamic substitution of registry name
          }),
        ]),
      }),
    );
  });

  test('should create Lambda Permission for EventBridge RegisterSchemaVersionRule with correct properties', () => {
    template.hasResourceProperties('AWS::Lambda::Permission',
      Match.objectLike({
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
            'Arn',
          ],
        },
        Principal: 'events.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSourceRegisterSchemaVersionRule.*'),
            'Arn',
          ],
        },
      }),
    );
  });


  test('should create EventBridge Rule for Glue DeleteSchema with correct properties', () => {
    template.hasResourceProperties('AWS::Events::Rule',
      Match.objectLike({
        EventPattern: {
          source: [
            'aws.glue',
          ],
          detail: {
            eventSource: [
              'glue.amazonaws.com',
            ],
            eventName: [
              'DeleteSchema',
            ],
            requestParameters: {
              schemaId: {
                schemaArn: [
                  {
                    prefix: {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:glue:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          `:schema/${REGISTRY_NAME}/*`,
                        ],
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
        Name: 'DeleteSchemaRule',
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
                'Arn',
              ],
            },
            Id: Match.stringLikeRegexp('Target.*'),
            Input: `{"registryName":"${REGISTRY_NAME}"}`,
          }),
        ]),
      }),
    );
  });

  test('should create Lambda Permission for EventBridge to invoke function with correct properties', () => {
    template.hasResourceProperties('AWS::Lambda::Permission',
      Match.objectLike({
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSource.*'),
            'Arn',
          ],
        },
        Principal: 'events.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneGsrKinesisDataSourceDeleteSchemaRule.*'),
            'Arn',
          ],
        },
      }),
    );
  });


});
