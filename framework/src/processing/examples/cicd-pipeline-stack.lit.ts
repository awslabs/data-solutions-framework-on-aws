// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmrApplicationStackFactory } from './cicd-application-stack.lit';
import * as dsf from '../../index';
import { CodePipelineSource } from 'aws-cdk-lib/pipelines';

/// !show
export class CICDPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new dsf.processing.SparkEmrCICDPipeline(this, 'SparkCICDPipeline', {
      sparkApplicationName: 'SparkTest',
      applicationStackFactory: new EmrApplicationStackFactory(),
      source: CodePipelineSource.connection('owner/weekly-job', 'mainline', {
        connectionArn: 'arn:aws:codeconnections:eu-west-1:123456789012:connection/aEXAMPLE-8aad-4d5d-8878-dfcab0bc441f'
      }),
    });
  }
}
/// !hide

const app = new cdk.App();
new CICDPipelineStack(app, 'CICDPipelineStack');