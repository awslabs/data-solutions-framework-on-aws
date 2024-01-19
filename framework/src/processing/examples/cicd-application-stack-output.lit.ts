// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
export class EmrApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, _stage: dsf.utils.CICDStage) {
        super(scope, id);

        const processingStateMachine = new StateMachine(this, 'ProcessingStateMachine', {
            // definition ...
        });

        new cdk.CfnOutput(this, 'ProcessingStateMachineArn', {
            value: processingStateMachine.stateMachineArn,
        });
    }
}
/// !hide
