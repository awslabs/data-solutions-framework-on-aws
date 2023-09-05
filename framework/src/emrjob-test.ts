import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { SparkRuntimeServerless } from './processing-runtime/emr-serverless';
import { EmrVersion } from './utils/emr-releases';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'SparkJobRuntimeServerlessStack', {
  env: {
    account: '214783019211',
    region: 'eu-west-1',
  },
});

new SparkRuntimeServerless(stack, 'EmrApp', {
  releaseLabel: EmrVersion.V6_12,
  name: 'SparkRuntimeServerless',
});


const myFileSystemPolicy = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['*'],
  })],
});

SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);

// const job = new SparkJob(stack, 'SparkJob', {
//   EmrServerlessJobConfig: {
//     applicationId: emrApplication.applicationId,
//     executionRoleArn: myExecutionRole.roleArn,
//     jobConfig: {
//       Name: JsonPath.format('ge_profile-{}', JsonPath.uuid()),
//       ApplicationId: emrApplication.applicationId,
//       ClientToken: JsonPath.uuid(),
//       ExecutionRoleArn: myExecutionRole.roleArn,
//       ExecutionTimeoutMinutes: 30,
//       JobDriver: {
//         SparkSubmit: {
//           EntryPoint: 's3://aws-data-analytics-workshops/emr-eks-workshop/scripts/pi.py',
//           SparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
//         },
//       },
//     },
//   },
// } as SparkJobProps);


// new cdk.CfnOutput(stack, 'SparkJobStateMachine', {
//   value: job.stateMachine.stateMachineArn,
// });