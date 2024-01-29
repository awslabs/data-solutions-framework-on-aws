// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { RemovalPolicy } from 'aws-cdk-lib';


class ExampleDefaultDataVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    // Set context value for global data removal policy
    this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
    
    new dsf.utils.DataVpc(this, 'MyDataVpc', {
      vpcCidr: '10.0.0.0/16',
      removalPolicy: RemovalPolicy.DESTROY
    });
  }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultDataVpcStack(app, 'ExampleDefaultDataVpc');