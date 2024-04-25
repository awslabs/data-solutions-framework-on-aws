import * as cdk from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes, Authentication, ClientAuthentication, KafkaVersion, MskBrokerInstanceType, MskProvisioned, ResourcePatternTypes } from '../lib/msk';
import { CertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
let certificateAuthority = CertificateAuthority.fromCertificateAuthorityArn(
    stack, 'certificateAuthority',
    'arn:aws:acm-pca:eu-west-1:123456789012:certificate-authority/aaaaaaaa-bbbb-454a-cccc-b454877f0d1b');

  const msk = new MskProvisioned(stack, 'cluster', {
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    numberOfBrokerNodes: 4,
    mskBrokerinstanceType: MskBrokerInstanceType.KAFKA_M7G_LARGE,
    kafkaVersion: KafkaVersion.V3_4_0,
    clientAuthentication: ClientAuthentication.saslTls(
      {
        iam: true,
        certificateAuthorities: [certificateAuthority],
      },
    ),
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    certificateDefinition: {
      adminPrincipal: 'User:CN=Admin',
      aclAdminPrincipal: 'User:CN=aclAdmin',
      secretCertificate: Secret.fromSecretCompleteArn(stack, 'secret', 'arn:aws:secretsmanager:eu-west-1:123456789012:secret:dsf/mskCert-3UhUJJ'),
    },
    allowEveryoneIfNoAclFound: false,
  });
/// !hide

msk.grantConsume('consume', 'foo', Authentication.MTLS, 'User:Cn=MyUser');

msk.setAcl('acl', {
    resourceType: AclResourceTypes.TOPIC,
    resourceName: 'topic-1',
    resourcePatternType: ResourcePatternTypes.LITERAL,
    principal: 'User:Cn=Toto',
    host: '*',
    operation: AclOperationTypes.CREATE,
    permissionType: AclPermissionTypes.ALLOW,
  },
  cdk.RemovalPolicy.DESTROY);

  