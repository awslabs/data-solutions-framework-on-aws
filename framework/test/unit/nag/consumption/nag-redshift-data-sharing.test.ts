// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Test RedshiftServerlessWorkgroup
 * @group unit/best-practice/consumption/redshift-data-sharing
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

const newShare = workgroup.createShare('NewShare', 'defaultdb', 'demoshare', 'sample', ['sample.customer', 'sample.inventory']);
// const dataShareArn = newShare.getAttString("dataShareArn")
workgroup.grantAccessToShare('GrantDemo1', newShare, '1234567890');
workgroup.createDatabaseFromShare('CreateDbFromShare', 'shared_db', 'demoshare', namespace.namespaceId);

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'CdkNagValidationFailure',
    reason: 'Intended behavior',
  },
], true);

NagSuppressions.addResourceSuppressionsByPath(stack,
  'Stack/DefaultNamespace/ManagementRole/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'GenerateDataKey* and ReEncrypt* can be used because all the corresponding actions are required in the inline policy' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/Vpc/Resource',
], [
  {
    id: 'AwsSolutions-VPC7',
    reason: 'Not part of the test scope',
  },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/DefaultNamespace/Provider/CustomResourceProvider',
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  '/Stack/RedshiftWorkgroup',

], [
  { id: 'AwsSolutions-IAM4', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-IAM5', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-L1', reason: 'Resource is not part of the test scope' },
], true);

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