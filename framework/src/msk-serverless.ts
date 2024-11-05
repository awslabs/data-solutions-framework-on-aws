import * as cdk from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
//import { AccountPrincipal, Effect, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { KafkaClientLogLevel, MskServerless } from './streaming';
import { DataVpc, Utils } from './utils';

// GIVEN
const app = new cdk.App();

const stack = new cdk.Stack(app, 'cluster-policy-test');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

//const msk =

new MskServerless(stack, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

// const cluterPolicy = new PolicyDocument(
//   {
//     statements: [
//       new PolicyStatement ({
//         actions: ['kafka:*'],
//         resources: [msk.cluster.attrArn],
//         effect: Effect.ALLOW,
//         principals: [new AccountPrincipal('093111472881')],
//       }),
//       new PolicyStatement ({
//         actions: ['kafka:*'],
//         resources: [msk.cluster.attrArn],
//         effect: Effect.ALLOW,
//         principals: [new AccountPrincipal('214783019211')],
//       }),
//     ],
//   },
// );

//msk.addClusterPolicy(cluterPolicy, 'cluterPolicy');