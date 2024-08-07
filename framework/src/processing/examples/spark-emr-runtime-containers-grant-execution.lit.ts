import * as cdk from 'aws-cdk-lib';
import { IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SparkEmrContainersRuntime } from '../lib';
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';


class ExampleSparkEmrContainersStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        //Layer must be changed according to the Kubernetes version used
        const kubectlLayer = new KubectlV30Layer(this, 'kubectlLayer');

        const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(this, {
            eksAdminRole: Role.fromRoleArn(this, 'EksAdminRole' , 'arn:aws:iam::12345678912:role/role-name-with-path'),
            publicAccessCIDRs: ['10.0.0.0/32'], // The list of public IP addresses from which the cluster can be accessible
            createEmrOnEksServiceLinkedRole: true, //if the the service linked role already exists set this to false
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
            name: 'dailyjob',
            createNamespace: true,
            eksNamespace: 'dailyjobns',
        });

        const execRole = emrEksCluster.createExecutionRole(this, 'ExecRole', s3ReadPolicy, 'dailyjobns', 's3ReadExecRole');

        const interactiveSession = emrEksCluster.addInteractiveEndpoint(this, 'interactiveSession', {
           virtualClusterId: virtualCluster.attrId,
           managedEndpointName: 'interactiveSession',
           executionRole: execRole,
         });
        //Virtual Cluster ARN
        new cdk.CfnOutput(this, 'virtualClusterArn', {
            value: virtualCluster.attrArn,
        });

        //Interactive session ARN
        new cdk.CfnOutput(this, 'interactiveSessionArn', {
           value: interactiveSession.getAttString('arn'),
         });
        /// !show
        // IAM role that is used to start the execution and monitor its state
        const startJobRole: IRole = Role.fromRoleName(this, 'StartJobRole', 'StartJobRole'); 

        SparkEmrContainersRuntime.grantStartJobExecution(startJobRole, [execRole.roleArn], virtualCluster.attrArn);
        /// !hide
    }
}


const app = new cdk.App();
new ExampleSparkEmrContainersStack(app, 'ExampleSparkEmrServerlessStack');