// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests for the KafkaApi construct
*
* @group unit/best-practice/streaming/kafka-api
*/

import { Stack, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Authentication, ClientAuthentication, KafkaApi } from '../../../../src/streaming';


describe('Using default KafkaApi configuration should ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const brokerSecurityGroup = SecurityGroup.fromSecurityGroupId(stack, 'sg', 'sg-1234');
  const vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
    vpcId: 'XXXXXXXX',
    availabilityZones: ['us-east-1a'],
    vpcCidrBlock: '10.0.0.0/16',
    privateSubnetIds: ['XXXXXXXX'],
  });

  const kafkaApi = new KafkaApi(stack, 'KafkaApi', {
    clusterArn: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
    brokerSecurityGroup,
    vpc,
    clientAuthentication: ClientAuthentication.sasl({
      iam: true,
    }),
  });

  kafkaApi.setTopic(stack, 'topic1',
    Authentication.IAM,
    {
      topic: 'topic1',
      numPartitions: 3,
      replicationFactor: 1,
    },
  );

  kafkaApi.grantConsume('topic1ConsumerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'consumerRole', 'consumer'));
  kafkaApi.grantProduce('topic1ProducerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'producerRole', 'producer'));


  const template = Template.fromStack(stack, {});
  console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a security group for the DsfProvider', () => {
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

  test('should create a security group ingress rule to connect to Kafka ports', () => {
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

  test('should create the proper IAM policy to interact with MSK', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'kafka-cluster:Connect',
              'kafka-cluster:AlterCluster',
              'kafka-cluster:DescribeCluster',
              'kafka-cluster:DescribeClusterV2',
              'kafka:GetBootstrapBrokers',
              'kafka:DescribeClusterV2',
              'kafka:CreateVpcConnection',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
          },
          {
            Action: [
              'kafka-cluster:CreateTopic',
              'kafka-cluster:DescribeTopic',
              'kafka-cluster:AlterTopic',
              'kafka-cluster:DeleteTopic',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:topic/MyCluster/xxxx-xxxxx-xxxx/*',
          },
          {
            Action: [
              'kafka-cluster:AlterGroup',
              'kafka-cluster:DescribeGroup',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:group/MyCluster/xxxx-xxxxx-xxxx/*',
          },
        ],
      },
    });
  });

  test('should attach the IAM policy to interact with MSK to the provider role', () => {
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
          Ref: Match.stringLikeRegexp('KafkaApiMskIamProviderVpcPolicy.*'),
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

  test('should create proper topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      topics: Match.arrayWith([
        Match.objectLike({
          topic: 'topic1',
          numPartitions: 3,
          replicationFactor: 1,
        },
        ),
      ]),
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
            Resource: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
          },
          {
            Action: [
              'kafka-cluster:WriteData',
              'kafka-cluster:DescribeTopic',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:topic/MyCluster/xxxx-xxxxx-xxxx/topic1',
          },
        ],
      },
      PolicyName: Match.stringLikeRegexp('producerRolePolicy.*'),
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
            Resource: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
          },
          {
            Action: [
              'kafka-cluster:ReadData',
              'kafka-cluster:DescribeTopic',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:topic/MyCluster/xxxx-xxxxx-xxxx/topic1',
          },
          {
            Action: [
              'kafka-cluster:AlterGroup',
              'kafka-cluster:DescribeGroup',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:group/MyCluster/xxxx-xxxxx-xxxx/*',
          },
        ],
      },
      PolicyName: Match.stringLikeRegexp('consumerRolePolicy.*'),
      Roles: [
        'consumer',
      ],
    });
  });
});