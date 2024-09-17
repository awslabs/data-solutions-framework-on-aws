/**
 * Testing my changes
 *
 * @group mytests2
 */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataZoneHelpers, DataZoneMskEnvironmentAuthorizer } from '../../src/governance';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  
new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: 'dzd_3t58quhacu6947',
  centralAccountId: '632368511077',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new cdk.CfnOutput(stack, 'MyOutput', {
  value: 'true',
});

const consumerRole = new Role(stack, 'ConsumerRole', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});

DataZoneHelpers.createSubscriptionTarget(stack, 'SubscriptionTarget',
  {
    domainId: 'dzd_3t58quhacu6947',
    name: 'MskTopicAssetType',
    projectIdentifier: '66d8zxm6giklk7',
    revision: '1',
  },
  'msk',
  'dsf',
  'akhre7xydsp82v',
  [consumerRole],
  Role.fromRoleArn(stack, 'admin', 'arn:aws:iam::668876353122:role/gromav'),
)

let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.MyOutput).toContain('true');
});