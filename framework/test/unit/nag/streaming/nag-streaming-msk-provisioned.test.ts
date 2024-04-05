// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests Msk Provisioned
 *
 * @group unit/best-practice/streaming/msk-provisioned
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { ClientAuthentication, KafkaVersion, MskProvisioned } from '../../../../src/streaming/lib/msk';


const app = new App();
const stack = new Stack(app, 'stack');

// Set context value for global data removal policy
stack.node.setContext('adsf', { remove_data_on_destroy: 'true' });

let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
  stack, 'certificateAuthority',
  'arn:aws:acm-pca:eu-west-1:020491551420:certificate-authority/91c339d8-f02b-454a-b865-b454877f0d1b');

new MskProvisioned(stack, 'cluster', {
  clusterName: 'cluster',
  numberOfBrokerNodes: 2,
  kafkaVersion: KafkaVersion.V3_4_0,
  clientAuthentication: ClientAuthentication.saslTls(
    {
      iam: true,
      certificateAuthorities: [certificateAuthority],
    },
  ),
  removalPolicy: RemovalPolicy.DESTROY,
  certificateDefinition: {
    adminPrincipal: 'User:CN=Admin',
    aclAdminPrincipal: 'User:CN=aclAdmin',
    secretCertificate: Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:eu-west-1:020491551420:secret:dsf/mskCert-3UhUJJ'),
  },
});

Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/ZookeeperUpdateLambdaExecutionRolePolicy/Resource',
    '/stack/cluster/vpcPolicyLambdaUpdateZookeeperSg/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }],
);


NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/KafkaApi/LambdaExecutionRolePolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'This the policy for the lambda CR that manage CRUD operation within the MSK Provisioned' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/KafkaApi/MskCrudProvider/VpcPolicy/Resource',
    '/stack/cluster/vpcPolicyLambdaSetClusterConfiguration/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskCrudProvider/CustomResourceProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskAclAdminProvider/CustomResourceProvider/framework-onEvent/Resource',
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  ],
  [
    { id: 'AwsSolutions-IAM4', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
    { id: 'AwsSolutions-IAM5', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
    { id: 'AwsSolutions-L1', reason: 'Managed by the L2 resource for Custom Resources we cannot modify it' },
  ],
  true,
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/KafkaApi/LambdaExecutionRolePolicymskAclAdminCr/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is necessary for getting the bootstrapbrokers' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/KafkaApi/MskAclAdminProvider/VpcPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/SecurityGroup/Resource',
  [{ id: 'AwsSolutions-EC23', reason: 'Handled with Egress rules' }],
  true,
);


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  //Not able to suppress the Warning for 'AwsSolutions-EC23'
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});
