import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { CICDStage } from '../../index';

/// !show
export class EmrApplicationStackFactory extends dsf.ApplicationStackFactory {
    createStack(scope: Construct, stage: dsf.CICDStage): cdk.Stack {
        return new EmrApplicationStack(scope, 'EmrApplicationStack', stage);
    }
}

export class EmrApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, stage: dsf.CICDStage) {
        super(scope, id);

        // DEFINE YOUR APPLICATION STACK HERE
        // USE STAGE PARAMETER TO CUSTOMIZE THE STACK BEHAVIOR

        if (stage == CICDStage.PROD) {
            // prod only
        }
    }
}
/// !hide