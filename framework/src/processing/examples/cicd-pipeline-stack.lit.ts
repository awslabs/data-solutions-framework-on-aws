// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmrApplicationStackFactory } from './cicd-application-stack.lit';
import * as dsf from '../../index';

/// !show
export class CICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        new dsf.processing.SparkEmrCICDPipeline(this, 'SparkCICDPipeline', {
            sparkApplicationName: 'SparkTest',
            applicationStackFactory: new EmrApplicationStackFactory(),
        });
    }
}
/// !hide

const app = new cdk.App();
new CICDPipelineStack(app, 'CICDPipelineStack');