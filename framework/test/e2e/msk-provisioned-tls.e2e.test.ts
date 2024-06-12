// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for MSK provisioned - IAM auth
 *
 * @group e2e/streaming/msk-provisioned-mtls-auth
 */

import * as cdk from 'aws-cdk-lib';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { TestStack } from './test-stack';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, Authentication, ClientAuthentication, MSK_DEFAULT_VERSION, MskProvisioned, ResourcePatternTypes } from '../../src/streaming/lib/msk';
import { Utils } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'MskProvisionedTlsTestStack');
const testStack = new TestStack('MskProvisionedTlsTestStack', app, stack);
// const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
  stack, 'certificateAuthority',
  `arn:aws:acm-pca:eu-west-1:${testStack.stack.account}:certificate-authority/9206cda5-e629-4eed-89ad-61c93e696737`);

const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: `cluster${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  clientAuthentication: ClientAuthentication.saslTls(
    {
      certificateAuthorities: [certificateAuthority],
      iam: true,
    },
  ),
  kafkaVersion: MSK_DEFAULT_VERSION,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  certificateDefinition: {
    adminPrincipal: 'User:CN=admin',
    aclAdminPrincipal: 'User:CN=dsfe2e',
    secretCertificate: Secret.fromSecretCompleteArn(stack, 'aclTlsCert', `arn:aws:secretsmanager:eu-west-1:${testStack.stack.account}:secret:dsf/msk/e2e-tls-dXuccy`),
  },
});

msk.setTopic('topicProvisionedMtls', Authentication.MTLS, {
  topic: 'provisionedMtls',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

msk.setTopic('topicProvisionedIam', Authentication.IAM, {
  topic: 'provisionedIam',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

msk.setTopic('topicConfigentries', Authentication.MTLS, {
  topic: 'configentries',
  numPartitions: 1,
  replicationFactor: 1,
  configEntries: [
    {
      name: 'retention.ms',
      value: '90000',
    },
    {
      name: 'retention.bytes',
      value: '90000',
    },
  ],
}, cdk.RemovalPolicy.DESTROY, false, 1500);

msk.setAcl('AclMtls',
  {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'provisionedIam',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  },
  cdk.RemovalPolicy.DESTROY,
  Authentication.MTLS,
);

msk.setAcl('AclIam',
  {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'provisionedMtls',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  },
  cdk.RemovalPolicy.DESTROY,
  Authentication.IAM,
);

const kafkaClientRole = new Role(stack, 'producerRole', {
  assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
});

msk.grantProduce('grantIamProduceMtls',
  'provisionedIam',
  Authentication.IAM,
  kafkaClientRole,
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.MTLS,
);

msk.grantConsume('grantIamConsumeMtls',
  'provisionedMtls',
  Authentication.IAM,
  kafkaClientRole,
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.MTLS,
);

msk.grantProduce('grantIamProduceIam',
  'provisionedIam',
  Authentication.IAM,
  kafkaClientRole,
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.IAM,
);

msk.grantConsume('grantIamConsumeIam',
  'provisionedMtls',
  Authentication.IAM,
  kafkaClientRole,
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.IAM,
);

msk.grantProduce('grantMtlsProduceMtls',
  'provisionedIam',
  Authentication.MTLS,
  'User:Cn=Toto',
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.MTLS,
);

msk.grantConsume('grantMtlsConsumeMtls',
  'provisionedMtls',
  Authentication.MTLS,
  'User:Cn=Toto',
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.MTLS,
);

msk.grantProduce('grantMtlsProduceIam',
  'provisionedIam',
  Authentication.MTLS,
  'User:Cn=Toto',
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.IAM,
);

msk.grantConsume('grantMtlsConsumeIam',
  'provisionedMtls',
  Authentication.MTLS,
  'User:Cn=Toto',
  '*',
  cdk.RemovalPolicy.DESTROY,
  Authentication.IAM,
);

new cdk.CfnOutput(stack, 'MskProvisionedCluster', {
  value: msk.cluster.attrArn,
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('MSK provisioned successfully', async () => {
  // THEN
  expect(deployResult.MskProvisionedCluster).toContain('arn:aws:kafka:');

});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);