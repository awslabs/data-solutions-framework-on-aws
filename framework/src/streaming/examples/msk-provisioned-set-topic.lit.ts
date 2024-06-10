import * as cdk from 'aws-cdk-lib';
import { Authentication, MskProvisioned } from '../lib/msk';


const app = new cdk.App();

const stack = new cdk.Stack(app, 'MskProvisionedDsf');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);


const msk = new MskProvisioned(stack, 'cluster');

/// !show
msk.setTopic('topic1',
  Authentication.IAM, {
    topic: 'topic1',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      {
        name: 'retention.ms',
        value: '90000',
      },
      {
        name: 'retention.bytes',
        value: '90000',
      },
    ],
  }, cdk.RemovalPolicy.DESTROY, false, 1500);
/// !hide


  