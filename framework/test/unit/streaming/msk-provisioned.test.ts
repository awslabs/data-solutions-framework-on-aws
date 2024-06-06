// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Test MSK Provisioned construct
 *
 * @group unit/streaming/msk-provisioned
*/


import { join } from 'path';
import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Role } from 'aws-cdk-lib/aws-iam';
import { CfnConfiguration } from 'aws-cdk-lib/aws-msk';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, Authentication, ClientAuthentication, KafkaClientLogLevel, KafkaVersion, MskBrokerInstanceType, MskProvisioned, ResourcePatternTypes, VpcClientAuthentication } from '../../../src/streaming/lib/msk';
import { DataVpc } from '../../../src/utils';


describe('Create an MSK Provisioned cluster with a provided vpc and add topic as well as grant consume produce to a principal', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const msk = new MskProvisioned(stack, 'cluster', {
    removalPolicy: RemovalPolicy.DESTROY,
  });

  msk.setTopic('topic1',
    Authentication.IAM, {
      topic: 'topic1',
      numPartitions: 3,
      replicationFactor: 1,
    }, RemovalPolicy.DESTROY, false, 1500);

  msk.grantConsume('topic1', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'consumerRole', 'consumer'));
  msk.grantProduce('topic1', 'topic1', Authentication.IAM, Role.fromRoleName(stack, 'producerRole', 'producer'));

  expect(() => {
    msk.setAcl('acl', {
      resourceType: AclResourceTypes.TOPIC,
      resourceName: 'topic-1',
      resourcePatternType: ResourcePatternTypes.LITERAL,
      principal: 'User:Cn=Toto',
      host: '*',
      operation: AclOperationTypes.CREATE,
      permissionType: AclPermissionTypes.ALLOW,
    },
    RemovalPolicy.DESTROY,
    Authentication.MTLS);
  }).toThrow('MTLS Authentication is not supported for this cluster');

  const template = Template.fromStack(stack, {});

  test('MSK Serverless is created', () => {
    template.resourceCountIs('AWS::MSK::Cluster', 1);
  });

  test('MSK cluster has default broker type', () => {
    template.hasResourceProperties('AWS::MSK::Cluster', {
      BrokerNodeGroupInfo: Match.objectLike({
        InstanceType: 'kafka.m5.large',
        StorageInfo: { EBSStorageInfo: { VolumeSize: 100 } },
      }),
      KafkaVersion: '3.5.1',
      NumberOfBrokerNodes: 2,
    });
  });

  test('MSK cluster default authentication IAM ', () => {
    template.hasResourceProperties('AWS::MSK::Cluster', {
      ClientAuthentication: Match.objectLike(
        { Sasl: { Iam: { Enabled: true } } },
      ),
    });
  });

  test('Topic is created', () => {
    template.resourceCountIs('Custom::MskTopic', 1);
  });


  test('Verify topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      topic: Match.objectLike({
        topic: 'topic1',
        numPartitions: 3,
        replicationFactor: 1,
      },
      ),
    });
  });

  test('Verify role has policy attached for consuming from topic', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      Roles: ['consumer'],
      PolicyName: 'consumerRolePolicy3500D1E5',
    });
  });

  test('Verify role has policy attached for producing to topic', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      Roles: ['producer'],
      PolicyName: 'producerRolePolicy4096696D',
    });
  });


});


describe('Create an MSK Provisioned cluster with mTlS auth, provided vpc and add topic as well as grant consume produce to a principal', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  let vpc = new DataVpc(stack, 'vpc', {
    vpcCidr: '10.0.0.0/16',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:eu-west-1:123456789012:certificate-authority/aaaaaaaa-bbbb-454a-cccc-b454877f0d1b');

  let clusterConfiguration: CfnConfiguration =
    MskProvisioned.createClusterConfiguration(
      stack, 'ClusterConfigDsf',
      'dsfconfiguration',
      join(__dirname, './resources/cluster-config-msk-provisioned'),
      [KafkaVersion.V3_4_0],
    );

  const msk = new MskProvisioned(stack, 'cluster', {
    clusterName: 'cluster',
    vpc: vpc.vpc,
    subnets: vpc.vpc.selectSubnets(),
    brokerNumber: 4,
    brokerInstanceType: MskBrokerInstanceType.KAFKA_M7G_LARGE,
    kafkaVersion: KafkaVersion.V3_4_0,
    clientAuthentication: ClientAuthentication.saslTls(
      {
        iam: true,
        certificateAuthorities: [certificateAuthority],
      },
    ),
    vpcConnectivity: VpcClientAuthentication.sasl({
      iam: true,
    }),
    removalPolicy: RemovalPolicy.DESTROY,
    certificateDefinition: {
      adminPrincipal: 'User:CN=Admin',
      aclAdminPrincipal: 'User:CN=aclAdmin',
      secretCertificate: Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:eu-west-1:123456789012:secret:dsf/mskCert-3UhUJJ'),
    },
    configuration: {
      arn: clusterConfiguration.attrArn,
      revision: clusterConfiguration.attrLatestRevisionRevision,
    },
    allowEveryoneIfNoAclFound: false,
  });

  msk.setTopic('topic1',
    Authentication.MTLS, {
      topic: 'topic1',
      numPartitions: 3,
      replicationFactor: 1,
    }, RemovalPolicy.DESTROY, false, 1500);

  msk.setAcl('acl', {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic-1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  }, RemovalPolicy.DESTROY);

  const template = Template.fromStack(stack, {});

  test('MSK Porivisioned is created', () => {
    template.resourceCountIs('AWS::MSK::Cluster', 1);
  });

  test('Topic is created', () => {
    template.resourceCountIs('Custom::MskTopic', 1);
  });

  test('MSK cluster has default broker type', () => {
    template.hasResourceProperties('AWS::MSK::Cluster', {
      BrokerNodeGroupInfo: Match.objectLike({
        InstanceType: 'kafka.m7g.large',
      }),
    });
  });

  test('MSK cluster default authentication IAM ', () => {
    template.hasResourceProperties('AWS::MSK::Cluster', {
      ClientAuthentication: Match.objectLike(
        {
          Sasl: { Iam: { Enabled: true } },
          Tls: { CertificateAuthorityArnList: ['arn:aws:acm-pca:eu-west-1:123456789012:certificate-authority/aaaaaaaa-bbbb-454a-cccc-b454877f0d1b'] },
        },
      ),

    });
  });

  test('Verify topic definition', () => {
    template.hasResourceProperties('Custom::MskTopic', {
      topic: Match.objectLike({
        topic: 'topic1',
        numPartitions: 3,
        replicationFactor: 1,
      },
      ),
    });
  });


  test('Verify topic definition', () => {
    template.hasResourceProperties('Custom::MskAcl', {
      resourceName: 'topic-1',
      principal: 'User:Cn=Toto',
      resourceType: 2,
    });
  });

  test('Verify there is only one MSK cluster configuration', () => {
    template.resourceCountIs('AWS::MSK::Configuration', 1);
  });

  test('Verify ACLs for lambda CR to perform ACL', () => {
    template.hasResourceProperties('Custom::MskAcl', {
      resourceName: 'kafka-cluster',
      principal: 'User:CN=aclAdmin',
      resourceType: 4,
      logLevel: 'WARN',
    });
  });

  test('Verify Trigger to update MSK configuration and lock it', () => {
    template.hasResourceProperties('Custom::Trigger', {
      ExecuteOnHandlerChange: true,
      InvocationType: 'RequestResponse',
      ServiceToken: { 'Fn::GetAtt': ['AWSCDKTriggerCustomResourceProviderCustomResourceProviderHandler97BECD91', 'Arn'] },
      HandlerArn: { Ref: 'clusterUpdateZookeeperSgCurrentVersion6BC0411Dd3f8c0b3f35baf66398142df7e12bedd' },
    });
  });

});

describe('Create an MSK Provisioned cluster with mTlS auth, provided vpc and add topic as well as grant consume produce to a principal', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  let vpc = new DataVpc(stack, 'vpc', {
    vpcCidr: '10.0.0.0/16',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:eu-west-1:123456789012:certificate-authority/aaaaaaaa-bbbb-454a-cccc-b454877f0d1b');

  let clusterConfiguration: CfnConfiguration =
    MskProvisioned.createClusterConfiguration(
      stack, 'ClusterConfigDsf',
      'dsfconfiguration',
      join(__dirname, './resources/cluster-config-msk-provisioned'),
      [KafkaVersion.V3_4_0],
    );

  const msk = new MskProvisioned(stack, 'cluster', {
    clusterName: 'cluster',
    vpc: vpc.vpc,
    subnets: vpc.vpc.selectSubnets(),
    brokerNumber: 4,
    brokerInstanceType: MskBrokerInstanceType.KAFKA_M7G_LARGE,
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
      secretCertificate: Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:eu-west-1:123456789012:secret:dsf/mskCert-3UhUJJ'),
    },
    kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
    configuration: {
      arn: clusterConfiguration.attrArn,
      revision: clusterConfiguration.attrLatestRevisionRevision,
    },
    allowEveryoneIfNoAclFound: true,
  });

  msk.setAcl('acl', {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic-1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  },
  RemovalPolicy.DESTROY);


  const template = Template.fromStack(stack, {});

  test('Verify ACLs for lambda CR to perform ACL', () => {
    template.hasResourceProperties('Custom::Trigger', {
      ExecuteOnHandlerChange: true,
      InvocationType: 'RequestResponse',
      HandlerArn: { Ref: 'clusterUpdateZookeeperSgCurrentVersion6BC0411Dd3f8c0b3f35baf66398142df7e12bedd' },
    });
  });

  test('Verify ACLs for lambda CR to perform ACL with DEBUG in client log', () => {
    template.hasResourceProperties('Custom::MskAcl', {
      resourceName: 'kafka-cluster',
      principal: 'User:CN=aclAdmin',
      resourceType: 4,
      logLevel: 'DEBUG',
    });
  });

  test('Verify there is only onr trigger, used for zookeeper', () => {
    template.resourceCountIs('Custom::Trigger', 1);
  });


});