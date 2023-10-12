// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { GatewayVpcEndpoint, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnApplication } from 'aws-cdk-lib/aws-emrserverless';
import { Effect, Role, PolicyDocument, PolicyStatement, ServicePrincipal, ManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { Key, KeyUsage } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { SparkEmrServerlessRuntimeProps } from './spark-emr-runtime-serverless-props';
import { Context, EMR_DEFAULT_VERSION, EmrRuntimeVersion, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { NetworkConfiguration, vpcBootstrap } from '../../../utils/vpc-helper';

/**
* A construct to create a Spark EMR Serverless Application, along with methods to create IAM roles having the least privilege.
*/
export class SparkEmrServerlessRuntime extends TrackedConstruct {

  /**
     * A static method which will create an execution IAM role that can be assumed by EMR Serverless
     * The method returns the role it creates. If no `executionRolePolicyDocument` or `iamPolicyName`
     * The method will return a role with only a trust policy to EMR Servereless service principal.
     * You can use this role then to grant access to any resources you control.
     *
     * @param scope the scope in which to create the role
     * @param id passed to the IAM Role construct object
     * @param executionRolePolicyDocument the inline policy document to attach to the role. These are IAM policies needed by the job.
     * This parameter is mutually execlusive with iamPolicyName.
     * @param iamPolicyName the IAM policy name to attach to the role, this is mutually execlusive with executionRolePolicyDocument
     */
  public static createExecutionRole(scope: Construct, id: string, executionRolePolicyDocument?: PolicyDocument, iamPolicyName?: string): Role {

    if (executionRolePolicyDocument && iamPolicyName) {
      throw new Error('You must provide either executionRolePolicyDocument or iamPolicyName');
    }

    if (executionRolePolicyDocument) {
      //create an IAM role with emr-serverless as service pricinpal and return it
      return new Role(scope, id, {
        assumedBy: new ServicePrincipal('emr-serverless.amazonaws.com'),
        inlinePolicies: { executionRolePolicyDocument },
      });
    }

    if (iamPolicyName) {
      return new Role(scope, id, {
        assumedBy: new ServicePrincipal('emr-serverless.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromManagedPolicyName(scope, id, iamPolicyName!)],
      });
    }

    return new Role(scope, id, {
      assumedBy: new ServicePrincipal('emr-serverless.amazonaws.com'),
    });
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
  public static grantStartJobExecution(startJobRole: IRole, executionRoleArn: string[], applicationArns: string[]) {

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
        'emr-serverless:StopJobRun',
        'emr-serverless:DescribeApplication',
        'emr-serverless:GetJobRun',
      ],
      resources: applicationArns,
    }));

    startJobRole.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-serverless:StartJobRun',
      ],
      resources: applicationArns,
    }));

    startJobRole.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'emr-serverless:TagResource',
      ],
      resources: applicationArns,
    }));

  }

  /**
   * The ARN of the EMR Serverless application, such as arn:aws:emr-serverless:us-east-1:123456789012:application/ab4rp1abcs8xz47n3x0example
   * This is used to expose the ARN of the application to the user.
   */
  public readonly applicationArn: string;

  /**
   * The id of the EMR Serverless application, such as ab4rp1abcs8xz47n3x0example
   * This is used to expose the id of the application to the user.
   */
  public readonly applicationId: string;

  /**
   * If no VPC is provided, one is created by default
   * This attribute is used to expose the VPC,
   * if you provide your own VPC through the {@link SparkEmrServerlessRuntimeProps} the attribute will be `undefined`
   */
  public readonly vpc: Vpc | undefined;

  /**
   * If no VPC is provided, one is created by default along with a security group attached to the EMR Serverless Application
   * This attribute is used to expose the security group,
   * if you provide your own security group through the {@link SparkEmrServerlessRuntimeProps} the attribute will be `undefined`
   */
  public readonly emrApplicationSecurityGroup: SecurityGroup | undefined;

  /**
   * If no VPC is provided, one is created by default
   * This attribute is used to expose the Gateway Vpc Endpoint for Amazon S3
   * The attribute will be undefined if you provided the `networkConfiguration` through the {@link SparkEmrServerlessRuntimeProps}
   */
  public readonly s3GatewayVpcEndpoint: GatewayVpcEndpoint | undefined;

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

    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    const logKmsKey: Key = new Key(scope, 'logKmsKey', {
      enableKeyRotation: true,
      alias: `flowlog-vpc-key-for-emr-application-${props.name}`,
      removalPolicy: removalPolicy,
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      description: `Key used by the VPC created for EMR serverless application ${props.name}`,
    });

    let emrNetworkConfiguration = undefined;

    if (!props.networkConfiguration) {
      const networkConfiguration: NetworkConfiguration = vpcBootstrap(scope, '10.0.0.0/16', logKmsKey, props.removalPolicy, undefined, props.name);

      let privateSubnetIds: string [] = [];

      networkConfiguration.vpc.privateSubnets.forEach( function (subnet) {
        privateSubnetIds.push(subnet.subnetId);
      });

      const emrApplicationSecurityGroup = new SecurityGroup(this, 'SecurityGroup', {
        vpc: networkConfiguration.vpc,
        description: `Security group used by emr serverless application ${props.name}`,
      });

      emrNetworkConfiguration = {
        securityGroupIds: [emrApplicationSecurityGroup.securityGroupId],
        subnetIds: privateSubnetIds,
      };

      this.vpc = networkConfiguration.vpc;
      this.emrApplicationSecurityGroup = emrApplicationSecurityGroup;
      this.s3GatewayVpcEndpoint = networkConfiguration.s3GatewayVpcEndpoint;
    }


    const sparkApplication: CfnApplication = new CfnApplication(scope, `spark-serverless-application-${props.name}`, {
      ...props,
      networkConfiguration: props.networkConfiguration ?? emrNetworkConfiguration,
      releaseLabel: emrReleaseLabel,
      type: 'Spark',
    });

    this.applicationArn = sparkApplication.attrArn;
    this.applicationId = sparkApplication.attrApplicationId;
  }

  /**
    * A method which will grant an IAM Role the right to start and monitor a job.
    * The method will also attach an iam:PassRole permission to limited to the IAM Job Execution roles passed.
    * The excution role will be able to submit job to the EMR Serverless application created by the construct.
    *
    * @param startJobRole the role that will call the start job api and which need to have the iam:PassRole permission
    * @param executionRoleArn the role use by EMR Serverless to access resources during the job execution
    */
  public grantStartExecution(startJobRole: IRole, executionRoleArn: string) {

    SparkEmrServerlessRuntime.grantStartJobExecution(startJobRole, [executionRoleArn], [this.applicationArn]);
  }

}
