import * as cdk from 'aws-cdk-lib';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, ClientAuthentication, KafkaClientLogLevel, MskClusterType, ResourcePatternTypes } from '../lib/msk';
import { KafkaApi } from '../lib/msk/kafka-api';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


/// !show
let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
  stack, 'certificateAuthority',
  'arn:aws:acm-pca:eu-west-1:12345678912:certificate-authority/dummy-ca'
);

let secret = Secret.fromSecretCompleteArn(
  stack, 'secret', 'arn:aws:secretsmanager:eu-west-1:12345678912:secret:dsf/mskCert-dummy'
);

let vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
  vpcId: 'vpc-1111111111',
  vpcCidrBlock: '10.0.0.0/16',
  availabilityZones: ['eu-west-1a', 'eu-west-1b'],
  publicSubnetIds: ['subnet-111111111', 'subnet-11111111'],
  privateSubnetIds: ['subnet-11111111', 'subnet-1111111'],
});


const kafkaApi = new KafkaApi(stack, 'kafkaApi', {
  vpc: vpc,
  clusterArn: 'arn:aws:kafka:eu-west-1:12345678912:cluster/byo-msk/dummy-5cf3-42d5-aece-dummmy-2',
  clusterType: MskClusterType.PROVISIONED,
  brokerSecurityGroup: SecurityGroup.fromSecurityGroupId(stack, 'brokerSecurityGroup', 'sg-98237412hsa'),
  certficateSecret: secret,
  clientAuthentication: ClientAuthentication.saslTls({
    iam: true,
    certificateAuthorities: [certificateAuthority],
  },),
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
  serviceToken: 'arn:aws:lambda::XXXXXX:function:XXXXXX-kafkaApiMskIamProviderCustomResour-XXXXXX',
});
/// !hide

kafkaApi.setAcl('acl', {
  resourceType: AclResourceTypes.TOPIC,
  resourceName: 'topic-1',
  resourcePatternType: ResourcePatternTypes.LITERAL,
  principal: 'User:Cn=MyUser',
  host: '*',
  operation: AclOperationTypes.CREATE,
  permissionType: AclPermissionTypes.ALLOW,
},
cdk.RemovalPolicy.DESTROY);

