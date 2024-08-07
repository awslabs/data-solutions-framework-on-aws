import * as cdk from 'aws-cdk-lib';
import { MskServerless } from '../lib/msk';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';


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

const msk = new MskServerless(stack, 'cluster', {
    clusterName: 'msk-byov',
    securityGroups: [SecurityGroup.fromLookupByName(stack, 'brokerSecurityGroup', 'broker-sg', vpc)],
    subnets: vpc.selectSubnets(),
    vpc: vpc,
  });
/// !hide

new cdk.CfnOutput(stack, 'mskArn', {
  value: msk.cluster.attrArn,
});


msk.addTopic('topic1', {
  topic: 'topic1',
  numPartitions: 3,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);




