// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleDefaultDataVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new dsf.utils.DataVpc(this, 'MyDataVpc', {
      vpcCidr: '10.0.0.0/16',
    });
  }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultDataVpcStack(app, 'ExampleDefaultDataVpc');