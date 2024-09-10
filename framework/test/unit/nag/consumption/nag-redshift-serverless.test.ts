// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Test RedshiftServerlessWorkgroup
 * @group unit/best-practice/consumption/redshift-serverless-workgroup
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { IpAddresses, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from '../../../../src/consumption';

const app = new App();
const stack = new Stack(app, 'Stack');
const vpc = new Vpc(stack, 'Vpc', {
  ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
  enableDnsHostnames: true,
  enableDnsSupport: true,
  subnetConfiguration: [
    {
      name: 'private-dwh',
      subnetType: SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
});

const namespace = new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
  name: 'default',
  dbName: 'defaultdb',
});

const extraSecurityGroups = [new SecurityGroup(stack, 'ExtraSecurityGroup', {
  vpc,
})];

const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
  vpc,
  subnets: {
    subnetGroupName: 'private-dwh',
  },
  name: 'dsf-rs-test',
  namespace,
  baseCapacity: 8,
  removalPolicy: RemovalPolicy.DESTROY,
  port: 9999,
  extraSecurityGroups,
});

workgroup.runCustomSQL('DataApiCheck', 'defaultdb', 'select 1');

workgroup.catalogTables('RedshiftCatalog', 'redshift_default_db', 'defaultdb/public/test%');

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'CdkNagValidationFailure',
    reason: 'Intended behavior',
  },
], true);

NagSuppressions.addResourceSuppressionsByPath(stack,
  [
    'Stack/RedshiftWorkgroup/RedshiftCatalog/CrawlerRole/DefaultPolicy/Resource',
    'Stack/RedshiftWorkgroup/RedshiftCatalog/CrawlerRole/Resource',
  ],
  [
    { id: 'AwsSolutions-IAM5', reason: 'Required because crawler ID is not known yet at the time of creation.' },
    { id: 'AwsSolutions-IAM5', reason: 'Wildcard used for the secrets managed by Redshift because the ARN is not know yet.' },
    { id: 'AwsSolutions-IAM5', reason: 'Wildcard used for the namespaces because the ID is not know yet.' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/DefaultNamespace/ManagementRole/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'GenerateDataKey* and ReEncrypt* can be used because all the corresponding actions are required in the inline policy' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/DefaultNamespace/CreateSLR',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Inherited from another DSF construct, not in the scope of this test' },
    { id: 'AwsSolutions-IAM4', reason: 'Inherited from another DSF construct, not in the scope of this test' },
    { id: 'AwsSolutions-L1', reason: 'Inherited from another DSF construct, not in the scope of this test' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/RedshiftWorkgroup/DataApiCheckAccessData',
  'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  'Stack/DefaultNamespace/Provider/CustomResourceProvider',
  'Stack/Vpc/Resource',
],
[
  { id: 'AwsSolutions-IAM4', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-L1', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-IAM5', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-VPC7', reason: 'Resource is not part of the test scope' },
],
true,
);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/DefaultNamespace/Provider/CustomResourceProvider/waiter-state-machine/Resource',
  '/Stack/RedshiftWorkgroup/DataApiCheckAccessData/CrProvider/CustomResourceProvider/waiter-state-machine/Resource',
], [
  { id: 'AwsSolutions-SF2', reason: 'Resource managed by L2 and not exposed as property by CDK' },
  { id: 'AwsSolutions-SF1', reason: 'Resource managed by L2 and not exposed as property by CDK' },
],
true);

test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});