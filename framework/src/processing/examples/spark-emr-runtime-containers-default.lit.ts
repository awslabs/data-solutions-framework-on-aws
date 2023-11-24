import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SparkEmrContainersRuntime } from '../lib';
import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';

/// !show
class ExampleSparkEmrContainersStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        //Layer must be changed according to the Kubernetes version used
        const kubectlLayer = new KubectlV27Layer(this, 'kubectlLayer');

        // creation of the construct(s) under test
        const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(this, {
            eksAdminRole: Role.fromRoleArn(this, 'EksAdminRole' , 'arn:aws:iam::12345678912:role/role-name-with-path'),
            publicAccessCIDRs: ['10.0.0.0/32'],
            createEmrOnEksServiceLinkedRole: true,
            kubectlLambdaLayer: kubectlLayer,
        });

        const s3Read = new PolicyDocument({
        statements: [new PolicyStatement({
            actions: [
            's3:GetObject',
            ],
            resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
        })],
        });

        const s3ReadPolicy = new ManagedPolicy(this, 's3ReadPolicy', {
            document: s3Read,
        });

        const virtualCluster = emrEksCluster.addEmrVirtualCluster(this, {
            name: 'e2e',
            createNamespace: true,
            eksNamespace: 'e2ens',
        });

        const execRole = emrEksCluster.createExecutionRole(this, 'ExecRole', s3ReadPolicy, 'e2ens', 's3ReadExecRole');

        new cdk.CfnOutput(this, 'virtualClusterArn', {
            value: virtualCluster.attrArn,
        });

        new cdk.CfnOutput(this, 'execRoleArn', {
            value: execRole.roleArn,
        });
       
    }
}
/// !hide

const app = new cdk.App();
new ExampleSparkEmrContainersStack(app, 'ExampleSparkEmrServerlessStack');