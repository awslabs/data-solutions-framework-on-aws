/**
    * Testing my changes
    *
    * @group mytests
    */

import * as cdk from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { DataZoneMskCentralAuthorizer } from '../../src/governance';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
  domainId: 'dzd_dc495t9ime7von',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

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
