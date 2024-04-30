// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { TestStack } from './test-stack';
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from '../../src/consumption';

/**
 * E2E test for RedshiftDataSharing
 * @group e2e/consumption/redshift-data-sharing
 */
jest.setTimeout(6000000);
const app = new App();
const testStack = new TestStack('RSDataSharingE2ETestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const dbName = 'defaultdb';

const producerVPC = new Vpc(stack, 'ProducerVPC', {
  ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
  enableDnsHostnames: true,
  enableDnsSupport: true,
  availabilityZones: [
    `${stack.region}a`,
    `${stack.region}b`,
    `${stack.region}c`,
  ],
  subnetConfiguration: [
    {
      name: 'public',
      subnetType: SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'private-dwh',
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
  ],
});

const consumerVPC = new Vpc(stack, 'ConsumerVPC', {
  ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
  enableDnsHostnames: true,
  enableDnsSupport: true,
  availabilityZones: [
    `${stack.region}a`,
    `${stack.region}b`,
    `${stack.region}c`,
  ],
  subnetConfiguration: [
    {
      name: 'public',
      subnetType: SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'private-dwh',
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
  ],
});

const producerNamespace = new RedshiftServerlessNamespace(stack, 'ProducerNamespace', {
  name: 'producer-namespace',
  dbName,
  removalPolicy: RemovalPolicy.DESTROY,
});

const producerWorkgroup = new RedshiftServerlessWorkgroup(stack, 'ProducerRSWorkgroup', {
  vpc: producerVPC,
  subnets: {
    subnetGroupName: 'private-dwh',
  },
  name: 'producer-workgroup',
  namespace: producerNamespace,
  removalPolicy: RemovalPolicy.DESTROY,
});

const consumerNamespace = new RedshiftServerlessNamespace(stack, 'ConsumerNamespace', {
  name: 'consumer-namespace',
  dbName,
  removalPolicy: RemovalPolicy.DESTROY,
});

const consumerWorkgroup = new RedshiftServerlessWorkgroup(stack, 'ConsumerRSWorkgroup', {
  vpc: consumerVPC,
  subnets: {
    subnetGroupName: 'private-dwh',
  },
  name: 'consumer-workgroup',
  namespace: consumerNamespace,
  removalPolicy: RemovalPolicy.DESTROY,
});

const shareName = 'testshare';

const createCustomersTable = producerWorkgroup.runCustomSQL('CreateCustomerTable', dbName, 'create table public.customers (id varchar(100) not null, first_name varchar(50) not null, last_name varchar(50) not null, email varchar(100) not null)', 'drop table public.customers');

const newShare = producerWorkgroup.createShare('producer-share', dbName, shareName, 'public', ['public.customers']);
newShare.newShareCustomResource.node.addDependency(createCustomersTable);

const dataShareArn = newShare.dataShareArn;
const producerArn = newShare.producerArn;

const grantToConsumer = producerWorkgroup.grantAccessToShare('GrantToConsumer', newShare, consumerNamespace.namespaceId, undefined, true);

grantToConsumer.resource.node.addDependency(newShare.newShareCustomResource);
grantToConsumer.resource.node.addDependency(consumerNamespace);

const consumeShare = consumerWorkgroup.createDatabaseFromShare('consume-datashare', 'shared_db', shareName, producerNamespace.namespaceId);

consumeShare.resource.node.addDependency(grantToConsumer.resource);

const describeDataSharesForProducer = new AwsCustomResource(stack, 'DescribeDataSharesForProducer', {
  onCreate: {
    service: 'Redshift',
    action: 'DescribeDataSharesForProducer',
    parameters: {
      ProducerArn: producerArn,
    },
    physicalResourceId: PhysicalResourceId.of('e2etest-DescribeDataSharesForProducer'),
  },
  policy: AwsCustomResourcePolicy.fromSdkCalls({
    resources: AwsCustomResourcePolicy.ANY_RESOURCE,
  }),
});

const consumerIdentifier = describeDataSharesForProducer.getResponseField('DataShares.0.DataShareAssociations.0.ConsumerIdentifier');
const shareConsumerStatus = describeDataSharesForProducer.getResponseField('DataShares.0.DataShareAssociations.0.Status');

new CfnOutput(stack, 'DataShareArn', {
  value: dataShareArn,
  exportName: 'DataShareArn',
});

new CfnOutput(stack, 'ProducerNamespaceArn', {
  value: producerNamespace.namespaceArn,
  exportName: 'ProducerNamespaceArn',
});

new CfnOutput(stack, 'ConsumerNamespaceArn', {
  value: consumerNamespace.namespaceArn,
  exportName: 'ConsumerNamespaceArn',
});

new CfnOutput(stack, 'DescribeConsumerIdentifier', {
  value: consumerIdentifier,
  exportName: 'DescribeConsumerIdentifier',
});

new CfnOutput(stack, 'DescribeShareConsumerStatus', {
  value: shareConsumerStatus,
  exportName: 'DescribeShareConsumerStatus',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 3600000);

test('Share is created', async() => {
  expect(deployResult.DataShareArn).not.toBeNull();
});

test('Share consumer identifier is the consumer namespace arn', async() => {
  expect(deployResult.DescribeConsumerIdentifier).toBe(deployResult.ConsumerNamespaceArn);
});

test('Share consumer status is ACTIVE', async() => {
  expect(deployResult.DescribeShareConsumerStatus).toBe('ACTIVE');
});


afterAll(async () => {
  await testStack.destroy();
}, 3600000);
