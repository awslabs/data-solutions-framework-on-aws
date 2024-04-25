// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests MSK Serverless construct
 *
 * @group unit/streaming/msk-serverless
*/


import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Role } from 'aws-cdk-lib/aws-iam';

import { MskServerless } from '../../../src/streaming/lib/msk';
import { DataVpc } from '../../../src/utils';


describe('Create an MSK serverless cluster with a provided vpc and add topic as well as grant consume produce to a principal', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  let vpc = new DataVpc(stack, 'vpc', {
    vpcCidr: '10.0.0.0/16',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const msk = new MskServerless(stack, 'cluster', {
    clusterName: 'unit-test',
    vpcConfigs: [
      {
        subnetIds: vpc.vpc.privateSubnets.map((s) => s.subnetId),
        securityGroups: [vpc.vpc.vpcDefaultSecurityGroup],
      },
    ],
    vpc: vpc.vpc,
  });

  msk.addTopic('topic1', {
    topic: 'topic1',
    numPartitions: 3,
  });

  msk.addTopic('topic2', {
    topic: 'topic2',
    numPartitions: 3,
  });

  msk.grantConsume('topic1', Role.fromRoleName(stack, 'consumerRole', 'consumer'));
  msk.grantProduce('topic1', Role.fromRoleName(stack, 'producerRole', 'producer'));


  const template = Template.fromStack(stack, {});

  test('MSK Serverless is created', () => {
    template.resourceCountIs('AWS::MSK::ServerlessCluster', 1);
  });

  test('Topic is created', () => {
    template.resourceCountIs('Custom::MskTopic', 2);
  });

  test('MSK cluster default authentication IAM ', () => {
    template.hasResourceProperties('AWS::MSK::ServerlessCluster', {
      ClientAuthentication: Match.objectLike(
        { Sasl: { Iam: { Enabled: true } } },
      ),

    });
  });

  test('Verify topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      topic: Match.objectLike({
          topic: 'topic1',
          numPartitions: 3,
        },
        ),
    });
  });


  test('Verify role has policy attached for consuming from topic', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: 'consumerRolePolicy3500D1E5',
      PolicyDocument: {
        Statement: [
          {
            Action: 'kafka-cluster:Connect',
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'clusterCfnServerlessCluster0DEE6630',
                'Arn',
              ],
            },
          },
          {
            Action: [
              'kafka-cluster:ReadData',
              'kafka-cluster:DescribeTopic',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    'Fn::Select': [
                      1,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':kafka:',
                  {
                    'Fn::Select': [
                      3,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':',
                  {
                    'Fn::Select': [
                      4,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':topic/',
                  {
                    'Fn::Select': [
                      2,
                      {
                        'Fn::Split': [
                          '/',
                          {
                            'Fn::Select': [
                              5,
                              {
                                'Fn::Split': [
                                  ':',
                                  {
                                    'Fn::GetAtt': [
                                      'clusterCfnServerlessCluster0DEE6630',
                                      'Arn',
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  '/topic1',
                ],
              ],
            },
          },
          {
            Action: [
              'kafka-cluster:AlterGroup',
              'kafka-cluster:DescribeGroup',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    'Fn::Select': [
                      1,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':kafka:',
                  {
                    'Fn::Select': [
                      3,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':',
                  {
                    'Fn::Select': [
                      4,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':group/',
                  {
                    'Fn::Select': [
                      2,
                      {
                        'Fn::Split': [
                          '/',
                          {
                            'Fn::Select': [
                              5,
                              {
                                'Fn::Split': [
                                  ':',
                                  {
                                    'Fn::GetAtt': [
                                      'clusterCfnServerlessCluster0DEE6630',
                                      'Arn',
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  '/*',
                ],
              ],
            },
          },
        ],
      },
      Roles: [
        'consumer',
      ],
    });
  });

  test('Verify role has policy attached for producing to topic', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'kafka-cluster:Connect',
              'kafka-cluster:WriteDataIdempotently',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'clusterCfnServerlessCluster0DEE6630',
                'Arn',
              ],
            },
          },
          {
            Action: [
              'kafka-cluster:WriteData',
              'kafka-cluster:DescribeTopic',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    'Fn::Select': [
                      1,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':kafka:',
                  {
                    'Fn::Select': [
                      3,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':',
                  {
                    'Fn::Select': [
                      4,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': [
                              'clusterCfnServerlessCluster0DEE6630',
                              'Arn',
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  ':topic/',
                  {
                    'Fn::Select': [
                      2,
                      {
                        'Fn::Split': [
                          '/',
                          {
                            'Fn::Select': [
                              5,
                              {
                                'Fn::Split': [
                                  ':',
                                  {
                                    'Fn::GetAtt': [
                                      'clusterCfnServerlessCluster0DEE6630',
                                      'Arn',
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  '/topic1',
                ],
              ],
            },
          },
        ],
      },
      PolicyName: 'producerRolePolicy4096696D',
      Roles: [
        'producer',
      ],
    });
  });


});

describe('Create an MSK serverless cluster with a provided vpc and add topic as well as grant consume produce to a principal', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  new MskServerless(stack, 'cluster', {
    clusterName: 'unit-test',
  });

  const template = Template.fromStack(stack, {});

  test('There is one VPC created when no VPC is passed', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });
},
);