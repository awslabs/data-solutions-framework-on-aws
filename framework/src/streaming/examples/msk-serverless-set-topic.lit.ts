import * as cdk from 'aws-cdk-lib';
import { MskServerless, MskTopic } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'DsfTestMskServerless');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

/// !show
const msk = new MskServerless(stack, 'cluster');

let topic: MskTopic =  {
  topic: 'topic1',
  numPartitions: 3,
  replicationFactor: 1,
}

msk.addTopic('topic1', topic, cdk.RemovalPolicy.DESTROY, false, 1500);
/// !hide

new cdk.CfnOutput(stack, 'mskArn', {
  value: msk.cluster.attrArn,
});