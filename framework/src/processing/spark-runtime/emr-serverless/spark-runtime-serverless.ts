// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnApplication } from 'aws-cdk-lib/aws-emrserverless';
import { Effect, Role, PolicyDocument, PolicyStatement, ServicePrincipal, ManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SparkEmrServerlessRuntimeProps } from './spark-runtime-serverless-props';
import { EMR_DEFAULT_VERSION, EmrRuntimeVersion, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
* A construct to create a Spark EMR Serverless Application
*   The construct takes as props {@link SparkEmrServerlessRuntimeProps}
*   The construct offers method to create execution role for EMR Serverless
*   The construct offers a method to allow an IAM role to call the `StartJobRun` and monitor the status of the job
*
* @example
* const runtimeServerless = new SparkRuntimeServerless(stack, 'SparkRuntimeServerlessStack', {
*    releaseLabel: 'emr-6.12.0',
*    name: 'spark-serverless-demo'
* });

* const myFileSystemPolicy = new PolicyDocument({
*    statements: [new PolicyStatement({
*      actions: [
*        's3:GetObject',
*      ],
*      resources: ['S3-BUCKET'],
*    })],
*  });
*
* let myTestRole = new Role (stack, 'TestRole', {
*    assumedBy: IAM-PRINCIPAL,
* });
*
* const myExecutionRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);
* const myExecutionRole1 = SparkRuntimeServerless.createExecutionRole(stack, 'execRole2', myFileSystemPolicy)
*
* runtimeServerless.grantJobExecution(myTestRole, myExecutionRole.roleArn);
*
* new cdk.CfnOutput(stack, 'SparkRuntimeServerlessStackApplicationArn', {
*    value: runtimeServerless.applicationArn,
* });
*/
export class SparkEmrServerlessRuntime extends TrackedConstruct {

  /**
     * A static method which will create an execution IAM role that can be assumed by EMR Serverless and return it
     *
     * @param scope the scope in which to create the role
     * @param id passed to the IAM Role construct object
     * @param executionRolePolicyDocument the inline policy to attach to the role, this is the IAM policies needed by the job, for example they can be either access to S3 bucket or DynamDB table.
     * This parameter is mutually execlusive with iamPolicyName.
     * @param iamPolicyName the IAM policy name to attach to the role, this is mutually execlusive with executionRolePolicyDocument
     */
  public static createExecutionRole(scope: Construct, id: string, executionRolePolicyDocument?: PolicyDocument, iamPolicyName?: string): Role {

    let executionRole: Role;

    if (!executionRolePolicyDocument && !iamPolicyName) {
      throw new Error('You must provide either executionRolePolicyDocument or iamPolicyArn');
    }

    if (executionRolePolicyDocument) {
      //create an IAM role with emr-serverless as service pricinpal and return it
      executionRole = new Role(scope, id, {
        assumedBy: new ServicePrincipal('emr-serverless.amazonaws.com'),
        inlinePolicies: { executionRolePolicyDocument },
      });

    } else {
      executionRole = new Role(scope, id, {
        assumedBy: new ServicePrincipal('emr-serverless.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromManagedPolicyName(scope, id, iamPolicyName!)],
      });
    }

    return executionRole;
  }

  /**
     * A static method which will grant an IAM Role the right to start and monitor a job.
     * The method will also attach an iam:PassRole permission limited to the IAM Job Execution roles passed
     *
     * @param startJobRole the role that will call the start job api and which needs to have the iam:PassRole permission
     * @param executionRoleArn the role used by EMR Serverless to access resources during the job execution
     * @param applicationArns the EMR Serverless aplication ARN,
     * this is used by the method to limit the EMR Serverless applications the role can submit job to.
     */
  public static grantJobExecution(startJobRole: IRole, executionRoleArn: string[], applicationArns: string[]) {

    //method to validate if IAM Role ARN is valid or if a token do not fail
    //We need to test for CDK token in case the ARN is resolved at deployment time
    //This is done to fail early

    const regex_arn = /^arn:aws:iam::[0-9]{12}:role\/[a-zA-Z0-9-_]+$/;
    const regex_token = /^Token\[([0-9]+)\]$/;
    executionRoleArn.forEach(arn => {
      if (!regex_arn.test(arn) && regex_token.test(arn)) {
        throw new Error(`Invalid IAM Role ARN ${arn}`);
      }
    });

    startJobRole.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: executionRoleArn,
      conditions: {
        StringLike: {
          'iam:PassedToService': 'emr-serverless.amazonaws.com',
        },
      },
    }));

    startJobRole.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-serverless:StartApplication',
        'emr-serverless:StopApplication',
        'emr-serverless:StartJobRun',
        'emr-serverless:StopJobRun',
        'emr-serverless:DescribeApplication',
        'emr-serverless:GetJobRun',
      ],
      resources: applicationArns,
      conditions: {
        StringEquals: {
          'aws:ResourceTag/adsf-owned': 'true',
        },
      },
    }));

  }
  //The ARN of the EMR Serverless application, such as arn:aws:emr-serverless:us-east-1:123456789012:application/ab4rp1abcs8xz47n3x0example
  // This is used to expose the ARN of the application to the user.
  public readonly applicationArn: string;

  /**
     * @param {Construct} scope the Scope of the CDK Construct
     * @param {string} id the ID of the CDK Construct
     * @param props {@link SparkEmrServerlessRuntimeProps}
     */

  constructor(scope: Construct, id: string, props: SparkEmrServerlessRuntimeProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: SparkEmrServerlessRuntime.name,
    };

    super(scope, id, trackedConstructProps);

    const emrReleaseLabel: EmrRuntimeVersion = props.releaseLabel ? props.releaseLabel : EMR_DEFAULT_VERSION;

    const sparkApplication: CfnApplication = new CfnApplication(scope, `spark-serverless-application-${props.name}`, {
      ...props,
      releaseLabel: emrReleaseLabel,
      type: 'Spark',
    });

    this.applicationArn = sparkApplication.attrArn;
  }

  /**
    * A method which will grant an IAM Role the right to start and monitor a job.
    * The method will also attach an iam:PassRole permission to limited to the IAM Job Execution roles passed.
    * The excution role will be able to submit job to the EMR Serverless application created by the construct.
    *
    * @param startJobRole the role that will call the start job api and which need to have the iam:PassRole permission
    * @param executionRoleArn the role use by EMR Serverless to access resources during the job execution
    */
  public grantExecution(startJobRole: IRole, executionRoleArn: string) {

    SparkEmrServerlessRuntime.grantJobExecution(startJobRole, [executionRoleArn], [this.applicationArn]);
  }

}