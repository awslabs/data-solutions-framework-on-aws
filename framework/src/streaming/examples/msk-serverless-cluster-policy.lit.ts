import * as cdk from 'aws-cdk-lib';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes,MskProvisioned, ResourcePatternTypes } from '../lib/msk';
import { Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
const msk = new MskProvisioned(stack, 'cluster');
const cluterPolicy = new PolicyDocument(
    {
      statements: [
        new PolicyStatement ({
          actions: [
            'kafka:CreateVpcConnection',
            'kafka:GetBootstrapBrokers',
            'kafka:DescribeClusterV2',
          ],
          resources: [msk.cluster.attrArn],
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal('firehose.amazonaws.com')],
        }),
      ],
    },
  );
  
msk.addClusterPolicy(cluterPolicy, 'cluterPolicy');
/// !hide

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

  