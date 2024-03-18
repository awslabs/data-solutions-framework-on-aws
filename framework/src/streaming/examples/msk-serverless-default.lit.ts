import * as cdk from 'aws-cdk-lib';

import { ISubnet } from 'aws-cdk-lib/aws-ec2';
import { DataVpc } from '../../utils';
import { MskServerless } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'DsfTestMskProvisioned');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

/// !show
const msk = new MskServerless(stack, 'cluster', {
  clusterName: 'dev-demo',
  clientAuthentication: {
    sasl: {
      iam: {
        enabled: true,
      },
    },
  },
  vpcConfigs: [
    {
      subnetIds: vpc.vpc.privateSubnets.map((s: ISubnet) => s.subnetId),
      securityGroups: [vpc.vpc.vpcDefaultSecurityGroup],
    },
  ],
  vpc: vpc.vpc,
});
/// !hide

msk.addTopic(stack, 'topic1', [{
  topic: 'topic1',
  numPartitions: 3,
  replicationFactor: 1,
}], cdk.RemovalPolicy.DESTROY, false, 1500);

new cdk.CfnOutput(stack, 'mskArn', {
  value: msk.mskServerlessCluster.attrArn,
});
