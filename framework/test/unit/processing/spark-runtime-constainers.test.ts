// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests Spark runtime EMR Serverless construct
 *
 * @group unit/processing-runtime/containers/emr-containers
*/


import { Stack, App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
//import { AccountRootPrincipal, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { SparkEmrContainersRuntime } from '../../../src/processing';
//import { EmrRuntimeVersion } from '../../../src/utils';
import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27'

describe('Create an EKS cluster and enable it for EMR on EKS', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const kubectlLambdaLayer = new KubectlV27Layer(stack, 'kubectlLayer');  

  //const runtimeContainers = 
  
  SparkEmrContainersRuntime.getOrCreate(stack, {
    eksAdminRoleArn: 'arn:aws:iam::1234567890:role/EksAdmin',
    publicAccessCIDRs: ['1.1.1.1/32'],
    kubectlLambdaLayer: kubectlLambdaLayer
  });

  const template = Template.fromStack(stack);

  test('EKS cluster created with correct version and name', () => {
    // THEN
    template.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 1);
  
    template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
      Config: Match.objectLike({
        version: '1.27',
        name: 'data-platform',
      }),
    });
  });

  

});
