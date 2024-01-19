// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleDataLakeStorageNamingStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
/// !show
    new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage', {
        bronzeBucketName: dsf.utils.BucketUtils.generateUniqueBucketName(this, 'MyDataLakeStorage', 'custom-bronze-name')
    });
/// !hide
  }
}

const app = new cdk.App();
new ExampleDataLakeStorageNamingStack(app, 'ExampleDataLakeStorageNamingStack');