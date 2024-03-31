// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for MSK provisioned - IAM auth
 *
 * @group e2e/streaming/msk-provisioned-mtls-auth
 */

import * as cdk from 'aws-cdk-lib';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { TestStack } from './test-stack';
import { Authentitcation, ClientAuthentication, MSK_DEFAULT_VERSION, MskProvisioned } from '../../src/streaming/lib/msk';
import { Utils } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const testStack = new TestStack('MskProvisionedTestStack', app);
const { stack } = testStack;


stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
  stack, 'certificateAuthority',
  `arn:aws:acm-pca:eu-west-1:${testStack.stack.account}:certificate-authority/9206cda5-e629-4eed-89ad-61c93e696737`);

const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: `cluster${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  clientAuthentication: ClientAuthentication.saslTls(
    {
      certificateAuthorities: [certificateAuthority],
    },
  ),
  kafkaVersion: MSK_DEFAULT_VERSION,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  certificateDefinition: {
    adminPrincipal: 'admin',
    aclAdminPrincipal: 'User:CN=dsfe2e',
    secretCertificate: Secret.fromSecretNameV2(stack, 'aclTlsCert', 'dsf/msk/e2e-tls-dXuccy'),
  },
});

msk.setTopic(stack, 'topicProvisioned', Authentitcation.MTLS, {
  topic: 'provisioned',
  numPartitions: 1,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

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