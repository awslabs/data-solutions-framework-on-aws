import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleSparkJobEmrServerlessStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const runtime = new dsf.processing.SparkEmrServerlessRuntime(this, 'SparkRuntime', {
            name: 'mySparkRuntime',
        });

        const s3ReadPolicy = new PolicyDocument({
            statements: [
                PolicyStatement.fromJson({
                    actions: ['s3:GetObject'],
                    resources: ['arn:aws:s3:::bucket_name', 'arn:aws:s3:::bucket_name/*'],
                }),
            ],
        });

        const executionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'EmrServerlessExecutionRole', s3ReadPolicy);

        const nightJob = new dsf.processing.SparkEmrServerlessJob(this, 'SparkNightlyJob', {
            applicationId: runtime.applicationId,
            name: 'nightly_job',
            executionRoleArn: executionRole.roleArn,
            executionTimeoutMinutes: 30,
            s3LogUri: 's3://emr-job-logs-EXAMPLE/logs',
            sparkSubmitEntryPoint: 'local:///usr/lib/spark/examples/src/main/python/pi.py',
            sparkSubmitParameters: '--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4',
        });

        new CfnOutput(this, 'job-state-machine', {
            value: nightJob.stateMachine!.stateMachineArn,
        });
    }
}
/// !hide

const app = new cdk.App();
new ExampleSparkJobEmrServerlessStack(app, 'ExampleSparkJobEmrServerlessStack');
