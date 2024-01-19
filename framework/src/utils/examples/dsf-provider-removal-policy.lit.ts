// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { DsfProvider } from '../lib/dsf-provider';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';


class ExampleRemovalPolicyDsfProviderStack extends cdk.Stack{
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const myOnEventManagedPolicy = new ManagedPolicy(this, 'Policy1', {
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
    
    this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
    
    const myProvider = new DsfProvider(this, 'Provider', {
      providerName: 'my-provider',
      onEventHandlerDefinition: {
        managedPolicy: myOnEventManagedPolicy,
        handler: 'on-event.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/on-event.mjs'),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    /// !hide
    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: myProvider.serviceToken,
      resourceType: 'Custom::MyCustomResource',
    });

  }
}

const app = new cdk.App();
new ExampleRemovalPolicyDsfProviderStack(app, 'ExampleRemovalPolicyDsfProviderStack');

