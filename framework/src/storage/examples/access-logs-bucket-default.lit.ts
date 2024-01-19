// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleDefaultAccessLogsBucketStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        new dsf.storage.AccessLogsBucket(this, 'AccessLogsBucket');
    }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultAccessLogsBucketStack(app, 'ExampleDefaultDataLakeStorage');