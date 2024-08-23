/**
 * Testing my changes
 *
 * @group e2e/mytests
 */

import * as cdk from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { TestStack } from './test-stack';
import { KafkaClientLogLevel, MskServerless } from '../../src/streaming';
import { DataVpc, Utils } from '../../src/utils';
import { Role } from 'aws-cdk-lib/aws-iam';
import { DataZoneCustomAssetTypeFactory, DataZoneMskAssetType, DataZoneMskCentralAuthorizer, DataZoneMskEnvironmentAuthorizer, createSubscriptionTarget } from '../../src/governance/index';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const DOMAIN_ID = 'dzd_dc495t9ime7von';
const GOVERNANCE_PROJECT_ID = '656w78ba7fyfmv';
const CONSUMER_ENV_ID = '4k6pd6k90ooc2v';

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

const msk = new MskServerless(stack, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

msk.addTopic('topicServerless', {
  topic: 'test-topic',
  numPartitions: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);


const consumerRole = Role.fromRoleArn(stack, 'consumerRole', 'arn:aws:iam::632368511077:role/consumer-role');

const mskCentralAuthorizer = new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
  domainId: DOMAIN_ID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: DOMAIN_ID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

mskCentralAuthorizer.registerAccount('668876353122');

const assetFactory = new DataZoneCustomAssetTypeFactory(stack, 'AssetTypeFactory', { removalPolicy: cdk.RemovalPolicy.DESTROY });

const mskAssetType = new DataZoneMskAssetType(stack, 'MskAssetType', {
  domainId: DOMAIN_ID,
  projectId: GOVERNANCE_PROJECT_ID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  dzCustomAssetTypeFactory: assetFactory,
});

createSubscriptionTarget(stack, 'Consumer',
  mskAssetType.mskCustomAssetType,
  'testSubscription',
  'dsf',
  CONSUMER_ENV_ID,
  [consumerRole],
  assetFactory.createRole,
);

new cdk.CfnOutput(stack, 'MyOutput', {
  value: 'test',
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.MyOutput).toContain('test');
});
