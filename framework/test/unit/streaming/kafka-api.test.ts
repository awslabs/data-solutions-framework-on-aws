// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests for the KafkaApi construct
*
* @group unit/streaming/kafka-api
*/

import { Stack, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Authentication, ClientAuthentication, KafkaApi } from '../../../src/streaming';


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

  const certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:region:XXXXXX:certificate-authority/my-ca',
  );

  const secret = Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:region:XXXXXX:secret:dsf/mycert-foobar');

  const kafkaApi = new KafkaApi(stack, 'KafkaApi', {
    clusterArn: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
    brokerSecurityGroup,
    vpc,
    certficateSecret: secret,
    clientAuthentication: ClientAuthentication.saslTls({
      iam: true,
      certificateAuthorities: [certificateAuthority],
    }),
  });

  kafkaApi.setTopic(stack, 'topic1',
    Authentication.IAM,
    {
      topic: 'topic1',
    },
  );

  kafkaApi.setTopic(stack, 'topic2',
    Authentication.MTLS,
    {
      topic: 'topic2',
    },
  );

  kafkaApi.grantConsume('topic1IamConsumerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamConsumerRole', 'consumer'));
  kafkaApi.grantConsume('topic1TlsConsumerGrant', 'topic1', Authentication.MTLS, 'Cn=foo');
  kafkaApi.grantProduce('topic1IamProducerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamProducerRole', 'producer'));
  kafkaApi.grantProduce('topic1TlsProducerGrant', 'topic1', Authentication.MTLS, 'Cn=bar');

  const template = Template.fromStack(stack, {});
  console.log(JSON.stringify(template.toJSON(), null, 2));

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

  test('should create the proper IAM policy to interact with MSK via mTLS authentication', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'kafka:DescribeCluster',
            Effect: 'Allow',
            Resource: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
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
      topics: Match.arrayWith([
        Match.objectLike({
          topic: 'topic1',
        },
        ),
      ]),
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
      topics: Match.arrayWith([
        Match.objectLike({
          topic: 'topic2',
        },
        ),
      ]),
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
      mskClusterArn: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
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
      mskClusterArn: 'arn:aws:kafka:region:XXXXXX:cluster/MyCluster/xxxx-xxxxx-xxxx',
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
      PolicyName: Match.stringLikeRegexp('iamConsumerRolePolicy.*'),
      Roles: [
        'consumer',
      ],
    });
  });
});