// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { DsfProvider } from '../lib/dsf-provider';
import { Construct } from 'constructs';

class ExampleEnvDsfProviderStack extends cdk.Stack{
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
    const myProvider = new DsfProvider(this, 'Provider', {
      providerName: 'my-provider',
      onEventHandlerDefinition: {
        managedPolicy: myManagedPolicy,
        handler: 'on-event.handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/my-cr/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/my-cr/on-event.mjs'),
        environment: {
          MY_ENV_VARIABLE: 'my-env-variable-value',
        }
      },
    });
    /// !hide
    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: myProvider.serviceToken,
      resourceType: 'Custom::MyCustomResource',
    });


  }
}

const app = new cdk.App();
new ExampleEnvDsfProviderStack(app, 'ExampleEnvDsfProviderStack');


