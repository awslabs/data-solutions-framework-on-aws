// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleRegisterDataZoneMskCentralAuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !show
    const centralAuthorizer = new dsf.governance.DataZoneMskCentralAuthorizer(this, 'MskAuthorizer', {
      domainId: 'aba_dc999t9ime9sss',
    });
  
    // Add an account that is associated with the DataZone Domain
    centralAuthorizer.registerAccount('AccountRegistration', '123456789012');
    /// !hide

  }
}

const app = new cdk.App();
new ExampleRegisterDataZoneMskCentralAuthorizerStack(app, 'ExampleRegisterDataZoneMskCentralAuthorizerStack');