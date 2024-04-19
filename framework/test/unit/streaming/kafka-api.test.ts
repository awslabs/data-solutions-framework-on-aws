// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests for the KafkaApi construct
*
* @group unit/streaming/kafka-api
*/

import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { SecurityGroup, Vpc, Subnet } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { CfnCluster } from 'aws-cdk-lib/aws-msk';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Authentication, ClientAuthentication, KafkaApi, MskClusterType } from '../../../src/streaming';


describe('Using default KafkaApi configuration with MSK provisioned and IAM and mTLS authentication should ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const brokerSecurityGroup = SecurityGroup.fromSecurityGroupId(stack, 'sg', 'sg-1234');
  const vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
    vpcId: 'XXXXXXXX',
    availabilityZones: ['us-east-1a'],
    vpcCidrBlock: '10.0.0.0/16',
    privateSubnetIds: ['XXXXXXXX'],
  });

  const certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:region:XXXXXX:certificate-authority/my-ca',
  );

  const secret = Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar');

  const cluster = new CfnCluster(stack, 'MyCluster', {
    clientAuthentication: {
      sasl: {
        iam: {
          enabled: true,
        },
      },
      tls: {
        enabled: true,
        certificateAuthorityArnList: [certificateAuthority.certificateAuthorityArn],
      },
    },
    brokerNodeGroupInfo: {
      clientSubnets: vpc.privateSubnets.map(s => s.subnetId),
      instanceType: 'kafka.m5large',
      securityGroups: [brokerSecurityGroup.securityGroupId],
    },
    clusterName: 'XXXXXX',
    kafkaVersion: '3.5.1',
    numberOfBrokerNodes: 3,
  });

  const kafkaApi = new KafkaApi(stack, 'KafkaApi', {
    clusterArn: cluster.attrArn,
    clusterType: MskClusterType.PROVISIONED,
    brokerSecurityGroup,
    vpc,
    certficateSecret: secret,
    clientAuthentication: ClientAuthentication.saslTls({
      iam: true,
      certificateAuthorities: [certificateAuthority],
    }),
  });

  kafkaApi.setTopic('topic1',
    Authentication.IAM,
    {
      topic: 'topic1',
      numPartitions: 1,
    },
  );

  kafkaApi.setTopic('topic2',
    Authentication.MTLS,
    {
      topic: 'topic2',
      numPartitions: 1,
    },
  );

  kafkaApi.grantConsume('topic1IamConsumerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamConsumerRole', 'consumer'));
  kafkaApi.grantConsume('topic1TlsConsumerGrant', 'topic1', Authentication.MTLS, 'Cn=foo');
  kafkaApi.grantProduce('topic1IamProducerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamProducerRole', 'producer'));
  kafkaApi.grantProduce('topic1TlsProducerGrant', 'topic1', Authentication.MTLS, 'Cn=bar');

  const template = Template.fromStack(stack, {});
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a security group for the DsfProvider with IAM authentication to Kafka', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
      GroupDescription: 'Stack/KafkaApi/MskIamSecurityGroup',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1',
        },
      ],
      VpcId: 'XXXXXXXX',
    }));
  });

  test('should create a security group for the DsfProvider with mTLS authentication to Kafka', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
      GroupDescription: 'Stack/KafkaApi/MskAclSecurityGroup',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1',
        },
      ],
      VpcId: 'XXXXXXXX',
    }));
  });

  test('should create a security group ingress rule to connect to Kafka ports with IAM authentication', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'Allow MSK IAM Ports',
      FromPort: 9098,
      GroupId: 'sg-1234',
      IpProtocol: 'tcp',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskIamSecurityGroup.*'),
          'GroupId',
        ],
      },
      ToPort: 9098,
    });
  });

  test('should create a security group ingress rule to connect to Kafka ports with mTLS authentication', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'Allow MSK TLS Ports',
      FromPort: 9094,
      GroupId: 'sg-1234',
      IpProtocol: 'tcp',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskAclSecurityGroup.*'),
          'GroupId',
        ],
      },
      ToPort: 9094,
    });
  });

  test('should create the proper IAM policy to interact with MSK via IAM authentication', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'kafka-cluster:Connect',
              'kafka:GetBootstrapBrokers',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'MyCluster',
                'Arn',
              ],
            },
          },
          {
            Action: [
              'kafka-cluster:CreateTopic',
              'kafka-cluster:DescribeTopic',
              'kafka-cluster:AlterTopic',
              'kafka-cluster:DeleteTopic',
              'kafka-cluster:DescribeTopicDynamicConfiguration',
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
                              'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                                      'MyCluster',
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
    });
  });

  test('should create the proper IAM policy to interact with MSK via mTLS authentication', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'kafka:DescribeCluster',
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': ['MyCluster', 'Arn'],
            },
          },
          {
            Action: 'kafka:GetBootstrapBrokers',
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: 'secretsmanager:GetSecretValue',
            Effect: 'Allow',
            Resource: 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar',
          },
        ],
      },
    });
  });

  test('should attach the IAM policy to the provider role to interact with MSK via IAM authentication', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
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
      ManagedPolicyArns: Match.arrayWith([
        {
          Ref: Match.stringLikeRegexp('KafkaApiMskIamProviderPolicy.*'),
        },
      ]),
    });
  });

  test('should attach the IAM policy to the provider role to interact with MSK via mTLS authentication', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
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
      ManagedPolicyArns: Match.arrayWith([
        {
          Ref: Match.stringLikeRegexp('KafkaApiMskAclProviderPolicy.*'),
        },
      ]),
    });
  });

  test('should deploy the DsfProvider in the VPC and subnets', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('KafkaApiMskIamSecurityGroup.*'),
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          'XXXXXXXX',
        ],
      },
    });
  });

  test('should deploy the DsfProvider in the VPC and subnets', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('KafkaApiMskAclSecurityGroup.*'),
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          'XXXXXXXX',
        ],
      },
    });
  });

  test('should create proper topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskIamProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
      logLevel: 'WARN',
      topic: Match.objectLike({
        topic: 'topic1',
        numPartitions: 1,
      }),
    });
  });

  test('should create proper topic definition via mTLS authentication', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskAclProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
      logLevel: 'WARN',
      topic: Match.objectLike({
        topic: 'topic2',
        numPartitions: 1,
      }),
    });
  });

  test('should create the ACL for producer', () => {
    template.hasResourceProperties('Custom::MskAcl', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskAclProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
      logLevel: 'WARN',
      secretArn: 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar',
      region: {
        Ref: 'AWS::Region',
      },
      mskClusterArn: {
        'Fn::GetAtt': ['MyCluster', 'Arn'],
      },
      resourceType: 2,
      resourcePatternType: 3,
      resourceName: 'topic1',
      principal: 'Cn=bar',
      host: '*',
      operation: 4,
      permissionType: 3,
    });
  });

  test('should create the ACL for consumer', () => {
    template.hasResourceProperties('Custom::MskAcl', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskAclProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
      logLevel: 'WARN',
      secretArn: 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar',
      region: {
        Ref: 'AWS::Region',
      },
      mskClusterArn: {
        'Fn::GetAtt': ['MyCluster', 'Arn'],
      },
      resourceType: 2,
      resourcePatternType: 3,
      resourceName: 'topic1',
      principal: 'Cn=foo',
      host: '*',
      operation: 3,
      permissionType: 3,
    });
  });

  test('should create proper IAM policy for granting producer permissions', () => {
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
                'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                                      'MyCluster',
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
      PolicyName: Match.stringLikeRegexp('iamProducerRolePolicy.*'),
      Roles: [
        'producer',
      ],
    });
  });

  test('should create proper IAM policy for granting consumer permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'kafka-cluster:Connect',
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                                      'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                              'MyCluster',
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
                                      'MyCluster',
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
      PolicyName: Match.stringLikeRegexp('iamConsumerRolePolicy.*'),
      Roles: [
        'consumer',
      ],
    });
  });
});

describe('Using custom KafkaApi configuration with MSK serverless and DELETE removal policy should ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const brokerSecurityGroup = SecurityGroup.fromSecurityGroupId(stack, 'sg', 'sg-1234');
  const vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
    vpcId: 'XXXXXXXX',
    availabilityZones: ['us-east-1a'],
    vpcCidrBlock: '10.0.0.0/16',
    privateSubnetIds: ['XXXXXXXX', 'YYYYYYYY'],
  });

  const certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:region:XXXXXX:certificate-authority/my-ca',
  );

  const secret = Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar');

  const cluster = new CfnCluster(stack, 'MyCluster', {
    clientAuthentication: {
      sasl: {
        iam: {
          enabled: true,
        },
      },
      tls: {
        enabled: true,
        certificateAuthorityArnList: [certificateAuthority.certificateAuthorityArn],
      },
    },
    brokerNodeGroupInfo: {
      clientSubnets: vpc.privateSubnets.map(s => s.subnetId),
      instanceType: 'kafka.m5large',
      securityGroups: [brokerSecurityGroup.securityGroupId],
    },
    clusterName: 'XXXXXX',
    kafkaVersion: '3.5.1',
    numberOfBrokerNodes: 3,
  });

  const kafkaApi = new KafkaApi(stack, 'KafkaApi', {
    clusterArn: cluster.attrArn,
    clusterType: MskClusterType.PROVISIONED,
    brokerSecurityGroup,
    vpc,
    subnets: { subnets: [Subnet.fromSubnetId(stack, 'subnet', 'YYYYYYYY')] },
    certficateSecret: secret,
    clientAuthentication: ClientAuthentication.saslTls({
      iam: true,
      certificateAuthorities: [certificateAuthority],
    }),
  });

  kafkaApi.setTopic('topic1',
    Authentication.IAM,
    {
      topic: 'topic1',
      numPartitions: 1,
      replicationFactor: 1,
      // replicaAssignment: [{ partition: 0, replicas: [0, 1] }],
      // configEntries: [{ name: 'cleanup.policy', value: 'compact' }],
    },
    RemovalPolicy.DESTROY,
  );

  kafkaApi.grantConsume('topic1TlsConsumerGrant', 'topic1', Authentication.MTLS, 'Cn=foo', RemovalPolicy.DESTROY);

  const template = Template.fromStack(stack, {});
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should deploy the DsfProvider in the VPC and subnets', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('KafkaApiMskIamSecurityGroup.*'),
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          'YYYYYYYY',
        ],
      },
    });
  });

  test('should create proper topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KafkaApiMskIamProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
      logLevel: 'WARN',
      topic: Match.objectLike({
        topic: 'topic1',
        numPartitions: 1,
        replicationFactor: 1,
        // replicaAssignment: [
        //   {
        //     partition: 0,
        //     replicas: [
        //       0,
        //       1,
        //     ],
        //   },
        // ],
        // configEntries: [
        //   {
        //     name: 'cleanup.policy',
        //     value: 'compact',
        //   },
        // ],
      }),
    });
  });

  test('should create resources reveted back to RETAIN removal policy', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('Custom::MskTopic', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('Custom::MskAcl', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('Using global removal policy and DELETE construct removal policy ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const brokerSecurityGroup = SecurityGroup.fromSecurityGroupId(stack, 'sg', 'sg-1234');
  const vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
    vpcId: 'XXXXXXXX',
    availabilityZones: ['us-east-1a'],
    vpcCidrBlock: '10.0.0.0/16',
    privateSubnetIds: ['XXXXXXXX', 'YYYYYYYY'],
  });

  const certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:region:XXXXXX:certificate-authority/my-ca',
  );

  const secret = Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar');

  const cluster = new CfnCluster(stack, 'MyCluster', {
    clientAuthentication: {
      sasl: {
        iam: {
          enabled: true,
        },
      },
      tls: {
        enabled: true,
        certificateAuthorityArnList: [certificateAuthority.certificateAuthorityArn],
      },
    },
    brokerNodeGroupInfo: {
      clientSubnets: vpc.privateSubnets.map(s => s.subnetId),
      instanceType: 'kafka.m5large',
      securityGroups: [brokerSecurityGroup.securityGroupId],
    },
    clusterName: 'XXXXXX',
    kafkaVersion: '3.5.1',
    numberOfBrokerNodes: 3,
  });

  const kafkaApi = new KafkaApi(stack, 'KafkaApi', {
    clusterArn: cluster.attrArn,
    clusterType: MskClusterType.PROVISIONED,
    brokerSecurityGroup,
    vpc,
    certficateSecret: secret,
    clientAuthentication: ClientAuthentication.saslTls({
      iam: true,
      certificateAuthorities: [certificateAuthority],
    }),
    removalPolicy: RemovalPolicy.DESTROY,
  });

  kafkaApi.setTopic('topic1',
    Authentication.IAM,
    {
      topic: 'topic1',
      numPartitions: 1,
    },
    RemovalPolicy.DESTROY,
  );

  kafkaApi.grantConsume('topic1TlsConsumerGrant', 'topic1', Authentication.MTLS, 'Cn=foo', RemovalPolicy.DESTROY);

  const template = Template.fromStack(stack, {});
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create resources with DELETE removal policy', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('Custom::MskTopic', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('Custom::MskAcl', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});