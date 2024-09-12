// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleDefaultDataZoneGsrMskDataSourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !show
    new dsf.governance.DataZoneGsrMskDataSource(this, 'DataZoneGsrMskDataSource', {
      domainId: 'aba_dc999t9ime9sss',
      registryName: 'schema-registry',
      projectId: '999a99aa9aaaaa',
      clusterName: 'msk-cluster'
    });
    /// !hide
    
  }
}

const app = new cdk.App();
new ExampleDefaultDataZoneGsrMskDataSourceStack(app, 'ExampleDefaultDataZoneGsrMskDataSourceStack');