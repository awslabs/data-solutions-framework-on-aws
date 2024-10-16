// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';


class ExampleVpcDataZoneMskEnvironmentAuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !show

    const permissionBoundaryPolicy = new ManagedPolicy(this, 'PermissionBoundaryPolicy', {
      statements: [
        // example of other permissions needed by the consumer
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:*'],
          resources: ['*'],
        }),
        // permissions needed to consume MSK topics and granted by the Authorizer
        dsf.governance.DataZoneMskEnvironmentAuthorizer.PERMISSIONS_BOUNDARY_STATEMENTS
      ],
    })

    new Role(this, 'ConsumerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      permissionsBoundary: permissionBoundaryPolicy,
    })
    /// !hide
    
  }
}

const app = new cdk.App();
new ExampleVpcDataZoneMskEnvironmentAuthorizerStack(app, 'ExampleVpcDataZoneMskEnvironmentAuthorizerStack');