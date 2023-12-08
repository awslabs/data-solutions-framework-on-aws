import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Role } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


class ExampleDefaultDataVpcStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
/// !show
        const flowLogKey = Key.fromKeyArn(this, 'FlowLogKey', 'XXXXXXXXXXXXXXXXXXXXXXXX');

        const flowLogRole = Role.fromRoleArn(this, 'FlowLogRole', 'XXXXXXXXXXXXXXXXXXXXXXXX');
        
        new dsf.utils.DataVpc(this, 'MyDataVpc', {
            vpcCidr: '10.0.0.0/16',
            flowLogKey,
            flowLogRole,
            flowLogRetention: RetentionDays.TWO_WEEKS,
        });
    }
}
/// !hide

const app = new cdk.App();
new ExampleDefaultDataVpcStack(app, 'ExampleDefaultDataVpc');