// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for the KafkaApi construct
 *
 * @group e2e/streaming/kafka-api-byo-service-token
 */


import { App, RemovalPolicy, CfnOutput, Fn } from 'aws-cdk-lib';

import { SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { TestStack } from './test-stack';
import { ClientAuthentication, KafkaApi, KafkaClientLogLevel, MskClusterType, MskServerless, Authentication } from '../../src/streaming';
import { DataVpc, Utils } from '../../src/utils';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('KafkaAPiTestStack', app);
const { stack: stackNewToken } = testStack;
stackNewToken.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let vpc = new DataVpc(stackNewToken, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stackNewToken, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

const msk = new MskServerless(stackNewToken, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stackNewToken.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

const kafkaApi = new KafkaApi(stackNewToken, 'kafkaApi', {
  vpc: vpc.vpc,
  clusterArn: msk.cluster.attrArn,
  subnets: vpc.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
  brokerSecurityGroup: securityGroup,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
  clusterType: MskClusterType.SERVERLESS,
  removalPolicy: RemovalPolicy.DESTROY,
  clientAuthentication: ClientAuthentication.sasl({ iam: true }),
  serviceToken: msk.serviceToken,
});

kafkaApi.setTopic('dummyTopic',
  Authentication.IAM,
  {
    topic: 'dummy',
    numPartitions: 3,
  },
  RemovalPolicy.DESTROY,
  true, 1000,
);

new CfnOutput(stackNewToken, 'clusterArn', {
  value: msk.cluster.attrArn,
});

let deployResult: Record<string, string>;

// GIVEN
const testStackReuseServiceToken = new TestStack('KafkaAPiTestStackReuseServiceToken', app);
const { stack: stackReuseServiceToken} = testStackReuseServiceToken;
stackReuseServiceToken.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const importedServiceToken = Fn.importValue(stackNewToken.stackName+'-ServiceToken');

const kafkaApiReuseServiceToken = new KafkaApi(stackReuseServiceToken, 'kafkaApiReuseServiceToken', {
  vpc: vpc.vpc,
  clusterArn: msk.cluster.attrArn,
  brokerSecurityGroup: securityGroup,
  clusterType: MskClusterType.SERVERLESS,
  clientAuthentication: ClientAuthentication.sasl({ iam: true }),
  serviceToken: importedServiceToken,
});


kafkaApiReuseServiceToken.setTopic('dummyTopicServiceToken',
  Authentication.IAM,
  {
    topic: 'dummyServiceToken',
    numPartitions: 3,
  },
  RemovalPolicy.DESTROY,
  true, 1000,
);

new CfnOutput(stackReuseServiceToken, 'reusedServiceToken', {
    value: kafkaApiReuseServiceToken.serviceToken!,
  });

let deployResultServiceToken: Record<string, string>;

beforeAll(async () => {
  // WHEN
  deployResult = await testStack.deploy();
  deployResultServiceToken = await testStackReuseServiceToken.deploy();
}, 10000000);

test('MSK cluster created successfully', async () => {
  // THEN
  expect(deployResult['clusterArn']).toContain('arn');
});

test('Kafka API outputs service token successfully', async () => {
    // THEN
    const keyWithServiceToken = Object.keys(deployResult).find(key => key.includes('ServiceToken'));
    if (keyWithServiceToken) {
      expect(deployResult[keyWithServiceToken]).toContain('arn');
    } else {
      throw new Error('ServiceToken not found in deploy result');
    }
});

test('Kafka API reuses service token successfully', async () => {
    // THEN
    expect(deployResultServiceToken.reusedServiceToken).toContain('arn');
    const keyWithServiceToken = Object.keys(deployResult).find(key => key.includes('ServiceToken'));
    if (keyWithServiceToken) {
      expect(deployResult[keyWithServiceToken]).toEqual(deployResultServiceToken.reusedServiceToken);
    } else {
      throw new Error('ServiceToken not found in deploy result');
    }
});

afterAll(async () => {
  await testStack.destroy();
  await testStackReuseServiceToken.destroy();
}, 10000000);