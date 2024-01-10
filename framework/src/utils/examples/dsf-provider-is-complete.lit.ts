// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';
/// !show
import { DsfProvider } from '../lib/dsf-provider';

class ExampleIsCompleteDsfProviderStack extends cdk.Stack{
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    /// !hide
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
    
    const myIsCompleteManagedPolicy = new ManagedPolicy(this, 'Policy2', {
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
    const myProvider = new DsfProvider(this, 'Provider', {
      providerName: 'my-provider',
      onEventHandlerDefinition: {
        managedPolicy: myOnEventManagedPolicy,
        handler: 'on-event.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/on-event.mjs'),
      },
      isCompleteHandlerDefinition: {
        managedPolicy: myIsCompleteManagedPolicy,
        handler: 'is-complete.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/is-complete.mjs'),
      }
    });

    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: myProvider.serviceToken,
      resourceType: 'Custom::MyCustomResource',
    });
  }
}
/// !hide
const app = new cdk.App();
new ExampleIsCompleteDsfProviderStack(app, 'ExampleIsCompleteDsfProviderStack');



