// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleDefaultDataZoneMskCentralAuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !show
    new dsf.governance.DataZoneMskCentralAuthorizer(this, 'MskAuthorizer', {
      domainId: 'aba_dc999t9ime9sss',
    });
    /// !hide
    
  }
}

const app = new cdk.App();
new ExampleDefaultDataZoneMskCentralAuthorizerStack(app, 'ExampleDefaultDataZoneMskCentralAuthorizerStack');