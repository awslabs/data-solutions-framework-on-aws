// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { randomBytes } from 'crypto';
import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { GatewayVpcEndpointAwsService, IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { RedshiftServerlessWorkgroup } from '../../src/consumption';

/**
 * E2E test for RedshiftServerlessWorkgroup
 * @group e2e/redshift-serverless
 */

jest.setTimeout(6000000);
const app = new App();
// eslint-disable-next-line local-rules/no-tokens-in-construct-id
const stack = new Stack(app, `RedshiftServerlessWorkgroupTestStack-${randomBytes(3).toString('hex').toLowerCase()}`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
const testStack = new TestStack('RedshiftServerlessWorkgroupTestStack', app, stack);
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const vpc = new Vpc(stack, 'rs-example-network', {
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
      name: 'private-dwh',
      subnetType: SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
  gatewayEndpoints: {
    S3: {
      service: GatewayVpcEndpointAwsService.S3,
    },
  },
});

vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

const adminIAMRole = new Role(stack, 'RSAdminRole', {
  assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  ],
});

const adminIAMRole2 = new Role(stack, 'RSAdminRole2', {
  assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  ],
});

adminIAMRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
adminIAMRole2.applyRemovalPolicy(RemovalPolicy.DESTROY);

const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
  vpc,
  subnets: {
    subnetGroupName: 'private-dwh',
  },
  workgroupName: 'dsf-rs-test',
  removalPolicy: RemovalPolicy.DESTROY,
  defaultNamespaceDefaultIAMRole: adminIAMRole,
  defaultNamespaceIAMRoles: [
    adminIAMRole2,
  ],
});

const rsData = workgroup.accessData(true);
const dbRole = rsData.createDbRole('defaultdb', 'engineering');
const dbSchema = rsData.grantDbSchemaToRole('defaultdb', 'public', 'engineering');
dbSchema.node.addDependency(dbRole);

const catalog = workgroup.catalogTables('rs-defaultdb');

new CfnOutput(stack, 'DefaultNamespaceName', {
  value: workgroup.namespace.namespaceName,
  exportName: 'DefaultNamespaceName',
});

new CfnOutput(stack, 'WorkgroupEndpoint', {
  value: workgroup.cfnResource.attrWorkgroupEndpointAddress,
  exportName: 'WorkgroupEndpoint',
});

new CfnOutput(stack, 'CatalogDatabase', {
  value: catalog.databaseName,
  exportName: 'CatalogDatabase',
});

new CfnOutput(stack, 'CatalogDatabaseCrawler', {
  value: catalog.crawler!.ref,
  exportName: 'CatalogDatabaseCrawler',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 3600000);

test('Default namespace should be created', async() => {
  expect(deployResult.DefaultNamespaceName).not.toBeNull();
});

test('Workgroup should be created', async() => {
  expect(deployResult.WorkgroupEndpoint).not.toBeNull();
});

test('Catalog database and crawler should be created', async() => {
  expect(deployResult.CatalogDatabase).not.toBeNull();
  expect(deployResult.CatalogDatabaseCrawler).not.toBeNull();
});


afterAll(async () => {
  await testStack.destroy();
}, 3600000);