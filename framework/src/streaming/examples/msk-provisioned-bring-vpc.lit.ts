import * as cdk from 'aws-cdk-lib';
import { KafkaClientLogLevel, KafkaVersion, MskBrokerInstanceType, MskProvisioned } from '../lib/msk';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';


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
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    numberOfBrokerNodes: 2,
    mskBrokerinstanceType: MskBrokerInstanceType.KAFKA_M5_LARGE,
    kafkaVersion: KafkaVersion.V3_4_0,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

new cdk.CfnOutput(stack, 'mskArn', {
    value: msk.cluster.attrArn,
});
/// !hide
