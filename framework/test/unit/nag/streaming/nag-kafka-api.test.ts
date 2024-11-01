// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests for the KafkaApi construct
*
* @group unit/best-practice/streaming/kafka-api
*/

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { CfnCluster } from 'aws-cdk-lib/aws-msk';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Authentication, ClientAuthentication, KafkaApi, MskClusterType } from '../../../../src/streaming';


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
    numPartitions: 2,
  },
);

kafkaApi.grantConsume('topic1IamConsumerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamConsumerRole', 'consumer'));
kafkaApi.grantConsume('topic1TlsConsumerGrant', 'topic1', Authentication.MTLS, 'Cn=foo');
kafkaApi.grantProduce('topic1IamProducerGrant', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'iamProducerRole', 'producer'));
kafkaApi.grantProduce('topic1TlsProducerGrant', 'topic1', Authentication.MTLS, 'Cn=bar');

Aspects.of(stack).add(new AwsSolutionsChecks({
  verbose: true,
}));

NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'CdkNagValidationFailure',
    reason: 'Intended behavior',
  },
], true);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/MyCluster',
  [
    { id: 'AwsSolutions-MSK6', reason: 'Not in the scope of the construct to test' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/KafkaApi/MskIamProviderPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Wildcard required for managing topics and groups' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/KafkaApi/MskAclProviderPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Wildcard required for getting MSK bootstrap brokers' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/iamConsumerRole/Policy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Wildcard required for getting consumer groups' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  [
    'Stack/KafkaApi/MskAclProvider/VpcPolicy/Resource',
    'Stack/KafkaApi/MskAclProvider/CleanUpProvider',
    'Stack/KafkaApi/MskAclProvider/CustomResourceProvider',
    'Stack/KafkaApi/MskIamProvider/VpcPolicy/Resource',
    'Stack/KafkaApi/MskIamProvider/CleanUpProvider',
    'Stack/KafkaApi/MskIamProvider/CustomResourceProvider',
    'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  ],
  [
    { id: 'AwsSolutions-IAM5', reason: 'Provided by DsfProvider' },
    { id: 'AwsSolutions-IAM4', reason: 'Provided by DsfProvider' },
    { id: 'AwsSolutions-L1', reason: 'Provided by DsfProvider' },
  ],
  true,
);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});