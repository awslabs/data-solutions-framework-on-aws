import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { SparkEmrContainersRuntime } from './processing';


const app = new App();
const stack = new Stack(app, 'testEmrContainers');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const kubectlLayer = new KubectlV27Layer(stack, 'kubectlLayer');
const eksAdminRole = Role.fromRoleArn(stack, 'EksAdminRole', `arn:aws:iam::${stack.account}:role/role-name-with-path`);

// creation of the construct(s) under test
const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(stack, {
  eksAdminRole,
  publicAccessCIDRs: ['10.0.0.0/32'],
  createEmrOnEksServiceLinkedRole: false,
  kubectlLambdaLayer: kubectlLayer,
  removalPolicy: RemovalPolicy.DESTROY,
});

const s3Read = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
  })],
});

const s3ReadPolicy = new ManagedPolicy(stack, 's3ReadPolicy', {
  document: s3Read,
});

emrEksCluster.addEmrVirtualCluster(stack, {
  name: 'e2e',
  createNamespace: true,
  eksNamespace: 'e2ens',
});

emrEksCluster.createExecutionRole(stack, 'ExecRole', s3ReadPolicy, 'e2ens', 's3ReadExecRole');