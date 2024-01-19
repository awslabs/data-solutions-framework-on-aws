// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EmrApplicationStackFactory } from './cicd-application-stack.lit';
import * as dsf from '../../index';

export class CICDPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
      super(scope, id);
/// !show
        new dsf.processing.SparkEmrCICDPipeline(this, 'SparkCICDPipeline', {
            sparkApplicationName: 'SparkTest',
            applicationStackFactory: new EmrApplicationStackFactory(),
            integTestScript: 'spark/integ.sh',
            integTestEnv: {
                STEP_FUNCTION_ARN: 'ProcessingStateMachineArn',
            },
            integTestPermissions: [
                new PolicyStatement({
                    actions: [
                        'states:StartExecution',
                        'states:DescribeExecution',
                    ],
                    resources: ['*'],
                }),
            ],
        });
/// !hide
    }
}

const app = new cdk.App();
new CICDPipelineStack(app, 'CICDPipelineStack');
