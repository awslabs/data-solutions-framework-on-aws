// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
export class EmrApplicationStackFactory extends dsf.utils.ApplicationStackFactory {
    createStack(scope: Construct, stage: dsf.utils.CICDStage): cdk.Stack {
        return new EmrApplicationStack(scope, 'EmrApplicationStack', stage);
    }
}

export class EmrApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, stage: dsf.utils.CICDStage) {
        super(scope, id);

        // DEFINE YOUR APPLICATION STACK HERE
        // USE STAGE PARAMETER TO CUSTOMIZE THE STACK BEHAVIOR

        if (stage == dsf.utils.CICDStage.PROD) {
            // prod only
        }
    }
}
/// !hide