import * as cdk from 'aws-cdk-lib';
import { MskServerless } from '../lib/msk';
import { Role } from 'aws-cdk-lib/aws-iam';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'DsfTestMskServerless');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


const msk = new MskServerless(stack, 'cluster');

new cdk.CfnOutput(stack, 'mskArn', {
  value: msk.mskServerlessCluster.attrArn,
});


/// !show
let iamRole = Role.fromRoleName(stack, 'role', 'role');

msk.grantConsume('topic1',iamRole);
/// !hide
