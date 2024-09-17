/**
 * Testing DataZone MSK constructs
 *
 * @group e2e/governance/datazone-msk
 */

import * as cdk from 'aws-cdk-lib';
import { CfnDomain } from 'aws-cdk-lib/aws-datazone';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { TestStack } from './test-stack';
import { DataZoneGsrMskDataSource, DataZoneMskAssetType, DataZoneMskCentralAuthorizer, DataZoneMskEnvironmentAuthorizer } from '../../src/governance/index';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('E2eTestStack', app);
const { stack } = testStack;

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const cfnDomain = new CfnDomain(stack, 'CfnDomain', {
  domainExecutionRole: 'arn:aws:iam::145388625860:role/service-role/AmazonDataZoneDomainExecution',
  name: 'dsfE2eTest',
});

// const consumerRole = new Role(stack, 'ConsumerRole', {
//   assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
// });

const mskCentralAuthorizer = new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
  domainId: cfnDomain.attrId,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: cfnDomain.attrId,
});

mskCentralAuthorizer.registerAccount('123456789012', '123456789012');

const mskAssetType = new DataZoneMskAssetType(stack, 'MskAssetType', {
  domainId: cfnDomain.attrId,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const gsrMskDataSource = new DataZoneGsrMskDataSource(stack, 'GsrMskDataSource', {
  domainId: cfnDomain.attrId,
  projectId: mskAssetType.owningProject!.attrId,
  registryName: 'testRegistry',
  clusterName: 'testCluster',
  runSchedule: Schedule.cron({ minute: '0', hour: '12' }),
  enableSchemaRegistryEvent: true,
});

// createSubscriptionTarget(stack, 'Consumer',
//   mskAssetType.mskCustomAssetType,
//   'testSubscription',
//   'dsf',
//   CONSUMER_ENV_ID,
//   [consumerRole],
//   assetFactory.createRole,
// );

new cdk.CfnOutput(stack, 'MskAssetTypeName', {
  value: mskAssetType.mskCustomAssetType.name,
});

new cdk.CfnOutput(stack, 'GsrMskDataSourceOutput', {
  value: gsrMskDataSource.registryName,
});

let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('MskTopicAssetType and DataZoneMskAuthorizers created successfully', async () => {
  // THEN
  expect(deployResult.MskAssetTypeName).toContain('MskTopicAssetType');
  expect(deployResult.GsrMskDataSourceOutput).toContain('testRegistry');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);
