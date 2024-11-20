// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Test RedshiftServerlessWorkgroup
 * @group unit/best-practice/consumption/redshift-data-api
 */

import { App, Aspects, Duration, RemovalPolicy, SecretValue, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnNamespace, CfnWorkgroup } from 'aws-cdk-lib/aws-redshiftserverless';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { RedshiftData } from '../../../../src/consumption';

const app = new App();
const stack = new Stack(app, 'Stack');
stack.node.setContext('adsf', { remove_data_on_destroy: 'false' });

const vpc = new Vpc(stack, 'Vpc');

const adminSecret = new Secret(stack, 'Secret', {
  secretObjectValue: {
    username: SecretValue.unsafePlainText('admin'),
    password: SecretValue.unsafePlainText('Test1234'),
  },
});

const cfnNamespace = new CfnNamespace(stack, 'TestCfnNamespace', {
  namespaceName: 'test',
  adminUsername: 'admin',
  adminUserPassword: 'Test1234',
});
const cfnWorkgroup = new CfnWorkgroup(stack, 'TestCfnWorkgroup', {
  workgroupName: 'test',
  namespaceName: cfnNamespace.attrNamespaceNamespaceName,
  subnetIds: vpc.selectSubnets().subnetIds,
  securityGroupIds: [vpc.vpcDefaultSecurityGroup],
});

const dataApi = new RedshiftData(stack, 'RedshiftData', {
  workgroupId: cfnWorkgroup.attrWorkgroupWorkgroupId,
  secret: adminSecret,
  vpc,
  subnets: vpc.selectSubnets(),
  createInterfaceVpcEndpoint: true,
  executionTimeout: Duration.seconds(600),
  removalPolicy: RemovalPolicy.DESTROY,
});

const testRole = new Role(stack, 'TestRole', {
  assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
});

dataApi.runCustomSQL('TestCustom', 'dev', 'create schema testschema', 'delete schema testschema');

const sourceBucket = new Bucket(stack, 'SourceBucket');

dataApi.ingestData('TestCopy', 'dev', 'testtable', sourceBucket, 'test-prefix', 'additional options', testRole);

dataApi.mergeToTargetTable('TestMerge', 'dev', 'testsourcetable', 'testtargettable', 'test_source_column', 'test_target_column');

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack,
  [
    '/Stack/RedshiftData/CrProvider',
  ],
  [
    { id: 'CdkNagValidationFailure', reason: 'CDK custom resource provider framework is using intrinsic function to get latest node runtime per region which makes the NAG validation fails' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/RedshiftData/InterfaceVpcEndpointSecurityGroup/Resource',
  [{ id: 'CdkNagValidationFailure', reason: 'VPC can be created or supplied as props, so CIDR block is not known in advance' }],
);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/Vpc',
  'Stack/Secret',
  'Stack/RedshiftData/CrProvider',
  'Stack/RedshiftData/CrProvider/CustomResourceProvider',
  'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  'Stack/SourceBucket',
], [
  { id: 'AwsSolutions-IAM4', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-IAM5', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-SMG4', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-VPC7', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-L1', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-S10', reason: 'Resource is not part of the test scope' },
  { id: 'AwsSolutions-S1', reason: 'Resource is not part of the test scope' },
],
true);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/RedshiftData/CrProvider/CustomResourceProvider/waiter-state-machine/Resource',
], [
  { id: 'AwsSolutions-SF2', reason: 'Resource managed by L2 and not exposed as property by CDK' },
  { id: 'AwsSolutions-SF1', reason: 'Resource managed by L2 and not exposed as property by CDK' },
],
true);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/RedshiftData/ExecutionRole/Resource',
], [
  { id: 'AwsSolutions-IAM4', reason: 'The managed policy is required for the custom resource execution in private VPC' },
  { id: 'AwsSolutions-IAM5', reason: 'The Custom Resource policy needs wildcard on the Redshift Data API' },
]);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  '/Stack/RedshiftData/TaggingManagedPolicy/Resource',
], [
  { id: 'AwsSolutions-IAM5', reason: 'The managed policy needs wildcard for tagging IAM roles that are not known' },
]);

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