import * as cdk from 'aws-cdk-lib';
import { AclOperationTypes, AclPermissionTypes, AclResourceTypes,MskProvisioned, ResourcePatternTypes } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
const msk = new MskProvisioned(stack, 'cluster');
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

  