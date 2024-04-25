// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for the KafkaApi construct
 *
 * @group e2e/streaming/kafka-api
 */


import { App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { CfnCluster } from 'aws-cdk-lib/aws-msk';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { TestStack } from './test-stack';
import { OpenSearchCluster } from '../../src/consumption/index';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, ClientAuthentication, KafkaApi, KafkaClientLogLevel, MskClusterType, ResourcePatternTypes } from '../../src/streaming';
import { DataVpc } from '../../src/utils';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('KafkaAPiTestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
});


const brokerSecurityGroup = new SecurityGroup(stack, 'brokerSecurityGroup', {
  vpc: vpc.vpc,
});

const cfnCluster = new CfnCluster(stack, 'MyCfnCluster', {
  brokerNodeGroupInfo: {
    clientSubnets: vpc.vpc.privateSubnets.map((subnet) => {
      return subnet.subnetId;
    }),
    instanceType: 'kafka.t3.small',

    // the properties below are optional
    securityGroups: [brokerSecurityGroup.securityGroupId],
  },
  clusterName: 'clusterName',
  kafkaVersion: 'kafkaVersion',
  numberOfBrokerNodes: 2,

  // the properties below are optional
  clientAuthentication: {
    sasl: {
      iam: {
        enabled: true,
      },
      scram: {
        enabled: false,
      },
    },
    tls: {
      certificateAuthorityArnList: [`arn:aws:acm-pca:eu-west-1:${testStack.stack.account}:certificate-authority/9206cda5-e629-4eed-89ad-61c93e696737`],
      enabled: true,
    },
    unauthenticated: {
      enabled: false,
    },
  },
  encryptionInfo: {
    encryptionInTransit: {
      clientBroker: 'TLS',
      inCluster: false,
    },
  },

});

let secret = Secret.fromSecretCompleteArn(stack, 'aclTlsCert', `arn:aws:secretsmanager:eu-west-1:${testStack.stack.account}:secret:dsf/msk/e2e-tls-dXuccy`);
let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
  stack, 'certificateAuthority',
  `arn:aws:acm-pca:eu-west-1:${testStack.stack.account}:certificate-authority/9206cda5-e629-4eed-89ad-61c93e696737`);

const mskApi = new KafkaApi(stack, 'kafkaApi', {
  vpc: vpc.vpc,
  clusterArn: cfnCluster.attrArn,
  subnets: vpc.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
  brokerSecurityGroup: brokerSecurityGroup,
  certficateSecret: secret,
  clientAuthentication: ClientAuthentication.saslTls({
    iam: true,
    certificateAuthorities: [certificateAuthority],
  }),
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
  clusterType: MskClusterType.PROVISIONED,
});

mskApi.setAcl('acl1',
  {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:*',
    host: '*',
    operation: AclOperationTypes.ALL,
    permissionType: AclPermissionTypes.ALLOW,
  });

new CfnOutput(stack, 'clusterArn', {
  value: cfnCluster.attrArn,
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Containers runtime created successfully', async () => {
  // THEN
  expect(deployResult.clusterArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);