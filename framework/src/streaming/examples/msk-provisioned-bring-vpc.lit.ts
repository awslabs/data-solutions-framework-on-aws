import * as cdk from 'aws-cdk-lib';
import { MskProvisioned } from '../lib/msk';
import { Vpc } from 'aws-cdk-lib/aws-ec2';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'DsfTestMskServerless');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
let vpc = Vpc.fromVpcAttributes(stack, 'vpc', {
    vpcId: 'vpc-1111111111',
    vpcCidrBlock: '10.0.0.0/16',
    availabilityZones: ['eu-west-1a', 'eu-west-1b'],
    publicSubnetIds: ['subnet-111111111', 'subnet-11111111'],
    privateSubnetIds: ['subnet-11111111', 'subnet-1111111'],
});

const msk = new MskProvisioned(stack, 'cluster', {
    vpc: vpc,
    clusterName: 'my-cluster',
    subnets: vpc.selectSubnets(),
});
/// !hide

new cdk.CfnOutput(stack, 'mskArn', {
    value: msk.cluster.attrArn,
});