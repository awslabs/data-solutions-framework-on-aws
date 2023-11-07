import * as cdk from 'aws-cdk-lib';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
export class EmrApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, _stage: dsf.CICDStage) {
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
