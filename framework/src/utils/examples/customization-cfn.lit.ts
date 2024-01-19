// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { CfnBucket } from "aws-cdk-lib/aws-s3";


class ExampleCustomizationL1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    // Create a data lake using DSF on AWS L3 construct
    const storage = new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage');

    // Access the CDK L1 Bucket construct exposed by the L3 construct
    const cfnBucket = storage.goldBucket.node.defaultChild as CfnBucket;

    // Override the CloudFormation property for transfer acceleration
    cfnBucket.addOverride('Properties.AccelerateConfiguration.AccelerationStatus', 'Enabled')
    /// !hide
  }
}

const app = new cdk.App();
new ExampleCustomizationL1Stack(app, 'ExampleCustomizationL1Stack');