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
  brokerNumber: 2,
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
  [
    '/stack/cluster/SetClusterConfigurationProvider/VpcPolicy/Resource',
    '/stack/cluster/vpcPolicyLambdaUpdateVpcConnectivity/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions for VPC' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/vpcPolicyLambdaSetClusterConfiguration/Resource',
  ],
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  [
    '/stack/cluster/KafkaApi/MskIamProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/CustomResourceProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/KafkaApi/MskAclProvider/CustomResourceProvider/framework-onEvent/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
    '/stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onEvent/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-isComplete/ServiceRole/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-isComplete/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onTimeout/ServiceRole/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/framework-onTimeout/Resource',
    '/stack/cluster/SetClusterConfigurationProvider/CustomResourceProvider/waiter-state-machine/Role/DefaultPolicy/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/VpcPolicy/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/CleanUpProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/CleanUpProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/CleanUpProvider/framework-onEvent/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-onEvent/ServiceRole/Resource',
    '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-onEvent/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-isComplete/ServiceRole/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-isComplete/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-onTimeout/ServiceRole/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/waiter-state-machine/Role/DefaultPolicy/Resource',
    // '/stack/cluster/UpdateVpcConnectivityProvider/CustomResourceProvider/framework-onTimeout/Resource',
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
  '/stack/cluster/UpdateVpcConnectivityLambdaExecutionRolePolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }]);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/KafkaApi/MskAclProviderPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is necessary for getting the bootstrapbrokers' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  ['/stack/cluster/KafkaApi/MskAclProvider/VpcPolicy/Resource',
    '/stack/cluster/KafkaApi/MskIamProvider/VpcPolicy/Resource'],
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/stack/cluster/KafkaApi/MskIamProviderPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Wild card is scoped with IAM conditions as well as resource with a partial wildcard' }],
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
