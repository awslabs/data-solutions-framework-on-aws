/**
 * Testing my changes

 * @group e2e/my2ndTests
 */

import * as cdk from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { DataZoneMskEnvironmentAuthorizer, createSubscriptionTarget } from '../../src/governance/index';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const DOMAIN_ID = 'dzd_dc495t9ime7von';
const GOVERNANCE_PROJECT_ID = '656w78ba7fyfmv';
const CONSUMER_ENV_ID = 'd126kap9jgs3vr';
const CENTRAL_ACCOUNT_ID = '632368511077';

const consumerRole = Role.fromRoleArn(stack, 'consumerRole', 'arn:aws:iam::668876353122:role/consumer-role');

new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: DOMAIN_ID,
  centralAccountId: CENTRAL_ACCOUNT_ID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const manageAccessRole = Role.fromRoleArn(stack, 'DzManageAccessRole', 'arn:aws:iam::668876353122:role/gromav');

createSubscriptionTarget(stack, 'Consumer',
  {
    domainIdentifier: DOMAIN_ID,
    name: 'MskTopicAssetType',
    projectIdentifier: GOVERNANCE_PROJECT_ID,
    revision: '25',
  },
  'testSubscription',
  'dsf',
  CONSUMER_ENV_ID,
  [consumerRole],
  manageAccessRole,
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
