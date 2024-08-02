// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
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
    
    /// !show
    const virtualCluster = emrEksCluster.addEmrVirtualCluster(this, {
      name: 'dailyjob',
      createNamespace: true,
      eksNamespace: 'dailyjobns',
    });
    
    new cdk.CfnOutput(this, 'virtualClusterArn', {
      value: virtualCluster.attrArn,
    });
    /// !hide
  }
}


const app = new cdk.App();
new ExampleSparkEmrContainersStack(app, 'ExampleSparkEmrServerlessStack');