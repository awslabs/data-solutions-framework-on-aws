// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { RedshiftServerlessWorkgroup } from '../../src/consumption';

/**
 * E2E test for RedshiftServerlessWorkgroup
 * @group e2e/redshift-serverless-workgroup
 */

jest.setTimeout(6000000);
const app = new App();
const stack = new Stack(app, 'RedshiftServerlessWorkgroupTestStack');
const testStack = new TestStack('RedshiftServerlessWorkgroupTestStack', app, stack);
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const vpc = new Vpc(stack, 'TestVpc', {
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

const adminIAMRole = new Role(stack, 'RedshiftAdminRole', {
  assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  ],
});

const adminIAMRole2 = new Role(stack, 'RedshiftAdminRole2', {
  assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  ],
});

const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
  vpc,
  subnets: {
    subnetGroupName: 'private-dwh',
  },
  workgroupName: 'dsf-rs-test',
  removalPolicy: RemovalPolicy.DESTROY,
  defaultNamespaceDefaultIAMRole: adminIAMRole,
  defaultNamespaceIAMRoles: [
    adminIAMRole,
    adminIAMRole2,
  ],
});

const rsData = workgroup.accessData(true);
const dbRole = rsData.createDbRole('EngineeringRole', 'defaultdb', 'engineering');
const dbSchema = rsData.grantDbSchemaToRole('EngineeringGrant', 'defaultdb', 'public', 'engineering');
dbSchema.node.addDependency(dbRole);

const catalog = workgroup.catalogTables('rs_defaultdb');

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
  //await testStack.destroy();
}, 3600000);