// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { aws_iam } from "aws-cdk-lib";


class ExampleCustomizationL2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /// !show
    // Create a data lake using DSF on AWS L3 construct
    const storage = new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage');

    // Access the CDK L2 Bucket construct exposed by the L3 construct
    const goldBucket = storage.goldBucket;

    // Use the Bucket CDK API to modify the Bucket Policy and add cross account write access
    goldBucket.addToResourcePolicy(new aws_iam.PolicyStatement({
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucketMultipartUploads',
            's3:ListMultipartUploadParts',
            's3:AbortMultipartUpload',
            's3:ListBucket',
          ],
          effect: aws_iam.Effect.ALLOW,
          principals: [new aws_iam.AccountPrincipal('123456789012')]
        }
    ));
    /// !hide
  }
}

const app = new cdk.App();
new ExampleCustomizationL2Stack(app, 'ExampleCustomizationL2Stack');