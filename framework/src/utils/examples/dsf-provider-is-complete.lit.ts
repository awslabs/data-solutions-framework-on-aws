// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { DsfProvider } from '../lib/dsf-provider';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';


const app = new cdk.App();
const stack = new cdk.Stack(app, 'TestStack');

const myOnEventManagedPolicy = new ManagedPolicy(stack, 'Policy1', {
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

const myIsCompleteManagedPolicy = new ManagedPolicy(stack, 'Policy2', {
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
const myProvider = new DsfProvider(stack, 'Provider', {
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
/// !hide
new cdk.CustomResource(stack, 'CustomResource', {
  serviceToken: myProvider.serviceToken,
  resourceType: 'Custom::MyCustomResource',
});
