// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleFactoryDataZoneMskAssetTypeStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /// !show
    const dataZoneAssetFactory = new dsf.governance.DataZoneCustomAssetTypeFactory(this, 'DataZoneCustomAssetTypeFactory', {
      domainId: 'aba_dc999t9ime9sss',
    });

    new dsf.governance.DataZoneMskAssetType(this, 'DataZoneMskAssetType', {
      domainId: 'aba_dc999t9ime9sss',
      projectId: 'xxxxxxxxxxx',
      dzCustomAssetTypeFactory: dataZoneAssetFactory
    });
    /// !hide
    
  }
}

const app = new cdk.App();
new ExampleFactoryDataZoneMskAssetTypeStack(app, 'ExampleFactoryDataZoneMskAssetTypeStack');