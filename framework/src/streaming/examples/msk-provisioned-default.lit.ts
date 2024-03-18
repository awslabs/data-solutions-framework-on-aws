import * as cdk from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { DataVpc } from '../../utils';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, KafkaClientLogLevel, KafkaVersion, MskBrokerInstanceType, MskProvisioned, ResourcePatternTypes } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

/// !show
const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: 'my-cluster',
  vpc: vpc.vpc,
  vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
  numberOfBrokerNodes: 2,
  mskBrokerinstanceType: MskBrokerInstanceType.KAFKA_M5_LARGE,
  kafkaVersion: KafkaVersion.V3_4_0,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  certificateDefinition: {
    adminPrincipal: 'User:CN=mskAdmin',
    aclAdminPrincipal: 'User:CN=aclAdmin',
    secretCertificate: Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:REGION:ACCOUNT-ID:secret:msk/mtls/lambda/clientcert-9kM2p6'),
  },
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});
/// !hide

msk.setAcl(stack, 'acl', {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic-1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  });

  