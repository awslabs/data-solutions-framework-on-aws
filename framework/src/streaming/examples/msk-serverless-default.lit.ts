import * as cdk from 'aws-cdk-lib';
import { MskServerless } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'DsfTestMskServerless');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
const msk = new MskServerless(stack, 'cluster');
/// !hide

new cdk.CfnOutput(stack, 'mskArn', {
  value: msk.cluster.attrArn,
});


msk.addTopic('topic1', {
  topic: 'topic1',
  numPartitions: 3,
  replicationFactor: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);


