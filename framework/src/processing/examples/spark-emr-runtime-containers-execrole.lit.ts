// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SparkEmrContainersRuntime } from '../lib';
import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';


class ExampleSparkEmrContainersStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const kubectlLayer = new KubectlV27Layer(this, 'kubectlLayer');

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
            resources: [
                'arn:aws:s3:::aws-data-analytics-workshop',
                'arn:aws:s3:::aws-data-analytics-workshop/*'],
        })],
        });

        const s3ReadPolicy = new ManagedPolicy(this, 's3ReadPolicy', {
            document: s3Read,
        });

        /// !show
        emrEksCluster.addEmrVirtualCluster(this, {
            name: 'dailyjob',
            createNamespace: true,
            eksNamespace: 'dailyjobns',
        });

        const execRole = emrEksCluster.createExecutionRole(
            this, 
            'ExecRole', 
            s3ReadPolicy, // the IAM managed policy granting permissions required by the Spark job
            'dailyjobns', // the namespace of the virtual cluster 
            's3ReadExecRole' //the IAM role name
        ); 

        new cdk.CfnOutput(this, 'execRoleArn', {
            value: execRole.roleArn,
        });
        /// !hide
    }
}


const app = new cdk.App();
new ExampleSparkEmrContainersStack(app, 'ExampleSparkEmrServerlessStack');