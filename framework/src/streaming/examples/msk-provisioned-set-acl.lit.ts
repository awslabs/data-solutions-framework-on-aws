import * as cdk from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, Authentitcation, KafkaClientLogLevel, KafkaVersion, MskBrokerInstanceType, MskProvisioned, ResourcePatternTypes } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


const msk = new MskProvisioned(stack, 'cluster', {
  clusterName: 'my-cluster',
  vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
  numberOfBrokerNodes: 2,
  mskBrokerinstanceType: MskBrokerInstanceType.KAFKA_M5_LARGE,
  kafkaVersion: KafkaVersion.V3_4_0,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

msk.setTopic(stack, 'topic1',
  Authentitcation.IAM, {
    topic: 'topic1',
    numPartitions: 3,
    replicationFactor: 1,
  }, cdk.RemovalPolicy.DESTROY, false, 1500);

/// !show
msk.setAcl(stack, 'acl', {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic-1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Bar',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  },
  cdk.RemovalPolicy.DESTROY);
/// !hide
  