/**
 * Testing my changes
 *
 * @group mytests
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { CfnDomain } from 'aws-cdk-lib/aws-datazone';
import { DataZoneMskAssetType, DataZoneMskCentralAuthorizer, DataZoneMskEnvironmentAuthorizer } from '../../src/governance';
import { MskProvisioned, MSK_DEFAULT_VERSION, Authentication } from '../../src/streaming/lib/msk';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: `testCluster`,
  kafkaVersion: MSK_DEFAULT_VERSION,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

msk.setTopic('topicProvisioned', Authentication.IAM, {
  topic: 'test-topic',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY);

const cfnDomain = new CfnDomain(stack, 'CfnDomain', {
    domainExecutionRole: 'arn:aws:iam::632368511077:role/service-role/AmazonDataZoneDomainExecution',
    name: 'dsfE2eTest',
  });
  
const mskCentralAuthorizer = new DataZoneMskCentralAuthorizer(testStack.stack, 'MskCentralAuthorizer', {
    domainId: cfnDomain.attrId,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });
  
new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: cfnDomain.attrId,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

 new DataZoneMskAssetType(stack, 'MskAssetType', {
  domainId: cfnDomain.attrId,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
})

mskCentralAuthorizer.registerAccount('crossAccount', '668876353122');

new cdk.CfnOutput(stack, 'MyOutput', {
  value: 'true',
});

// const consumerRole = new Role(stack, 'ConsumerRole', {
//   assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
// });

// DataZoneHelpers.createSubscriptionTarget(stack, 'SubscriptionTarget',
//   assetType.mskCustomAssetType,
//   'msk',
//   'dsf',
//   'bvnpnu5k49bep3',
//   [consumerRole],
//   Role.fromRoleArn(stack, 'admin', 'arn:aws:iam::632368511077:role/gromav'),
// )

let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.MyOutput).toContain('true');
});