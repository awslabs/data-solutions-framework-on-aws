// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for the KafkaApi construct
 *
 * @group e2e/streaming/kafka-api-byo-service-token
 */


import { App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

import { SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { TestStack } from './test-stack';
import { ClientAuthentication, KafkaApi, KafkaClientLogLevel, MskClusterType, MskServerless, Authentication } from '../../src/streaming';
import { DataVpc, Utils } from '../../src/utils';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('KafkaAPiTestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

const msk = new MskServerless(stack, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

const kafkaApi = new KafkaApi(stack, 'kafkaApi', {
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

new CfnOutput(stack, 'clusterArn', {
  value: msk.cluster.attrArn,
});

let deployResult: Record<string, string>;

beforeAll(async () => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

test('MSK cluster created successfully', async () => {
  // THEN
  expect(deployResult.clusterArn).toContain('arn');
});

/*
test('Kafka API outputs service token successfully', async () => {
    // THEN
    expect(deployResult.ServiceToken).toContain('arn');
});
*/

afterAll(async () => {
  await testStack.destroy();
}, 10000000);