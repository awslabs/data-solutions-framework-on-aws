// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { DsfProvider } from '../lib/dsf-provider';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


class ExampleVpcDsfProviderStack extends cdk.Stack{
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const myManagedPolicy = new ManagedPolicy(this, 'Policy', {
      document: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: [
              's3:*',
            ],
            effect: Effect.ALLOW,
            resources: ['*'],
          }),
        ],
      }),
    });
    /// !show

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcName: 'my-vpc'});
    const subnets = vpc.selectSubnets({subnetType: SubnetType.PRIVATE_WITH_EGRESS});
    const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'SecurityGroup', 'sg-123456');

    const myProvider = new DsfProvider(this, 'Provider', {
      providerName: 'my-provider',
      onEventHandlerDefinition: {
        managedPolicy: myManagedPolicy,
        handler: 'on-event.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/on-event.mjs'),
      },
      vpc,
      subnets,
      // the security group should be dedicated to the custom resource
      securityGroups: [securityGroup],
    });
    /// !hide

    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: myProvider.serviceToken,
      resourceType: 'Custom::MyCustomResource',
    });

  }
}

const app = new cdk.App();
new ExampleVpcDsfProviderStack(app, 'ExampleVpcDsfProviderStack');