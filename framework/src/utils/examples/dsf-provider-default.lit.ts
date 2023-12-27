// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import * as dsf from '../index';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';


const app = new cdk.App();
const stack = new cdk.Stack(app, 'TestStack');

const myManagedPolicy = new ManagedPolicy(stack, 'Policy', {
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
const myProvider = new dsf.DsfProvider(stack, 'Provider', {
  providerName: 'my-provider',
  onEventHandlerDefinition: {
    managedPolicy: myManagedPolicy,
    handler: 'on-event.handler',
    depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
    entryFile: path.join(__dirname, './resources/lambda/my-cr/on-event.mjs'),
  },
});

new cdk.CustomResource(stack, 'CustomResource', {
  serviceToken: myProvider.serviceToken,
  resourceType: 'Custom::MyCustomResource',
});
/// !hide