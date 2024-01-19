// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleAccessLogsBucketNamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
/// !show
    new dsf.storage.AccessLogsBucket(this, 'MyAccessLogs', {
        bucketName: dsf.utils.BucketUtils.generateUniqueBucketName(this, 'MyAccessLogs', 'my-custom-name')
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleAccessLogsBucketNamingStack(app, 'ExampleAccessLogsBucketNaming');