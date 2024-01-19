// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { IGatewayVpcEndpoint, ISecurityGroup, IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { CfnApplication } from 'aws-cdk-lib/aws-emrserverless';
import { Effect, Role, PolicyDocument, PolicyStatement, ServicePrincipal, ManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as semver from 'semver';
import { SparkEmrServerlessRuntimeProps } from './spark-emr-runtime-serverless-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../../utils';
import { EMR_DEFAULT_VERSION, EmrRuntimeVersion } from '../../emr-releases';

/**
 * A construct to create a Spark EMR Serverless Application, along with methods to create IAM roles having the least privilege.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Processing/spark-emr-serverless-runtime
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
  public static createExecutionRole(scope: Construct, id: string, executionRolePolicyDocument?: PolicyDocument, iamPolicyName?: string): IRole {

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
   * The default CIDR for the VPC when it is created
   */
  private static readonly DEFAULT_CIDR = '10.0.0.0/16';

  /**
   * The EMR Serverless application
   */
  public readonly application: CfnApplication;

  /**
   * If no VPC is provided, one is created by default along with a security group attached to the EMR Serverless Application
   * This attribute is used to expose the security group,
   * if you provide your own security group through the {@link SparkEmrServerlessRuntimeProps} the attribute will be `undefined`
   */
  public readonly emrApplicationSecurityGroup?: ISecurityGroup;

  /**
   * The VPC used by the EKS cluster
   */
  public readonly vpc?: IVpc;
  /**
   * The KMS Key used for the VPC flow log when the VPC is created
   */
  public readonly flowLogKey?: IKey;
  /**
   * The IAM Role used for the VPC flow log when the VPC is created
   */
  public readonly flowLogRole?: IRole;
  /**
   * The CloudWatch Log Group for the VPC flow log when the VPC is created
   */
  public readonly flowLogGroup?: ILogGroup;/**
   * The S3 VPC endpoint attached to the private subnets of the VPC when VPC is created
   */
  public readonly s3VpcEndpoint?: IGatewayVpcEndpoint;

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

    const releaseLabelSemver : string = emrReleaseLabel.split('-')[1];

    if (semver.lt(releaseLabelSemver, '6.9.0')) {
      throw new Error(`EMR Serverless supports release EMR 6.9 and above, provided release is ${emrReleaseLabel.toString()}`);
    }

    let emrNetworkConfiguration = undefined;

    if (!props.networkConfiguration) {

      const dataVpc = new DataVpc(this, 'DataVpc', {
        vpcCidr: SparkEmrServerlessRuntime.DEFAULT_CIDR,
        removalPolicy,
      });
      this.vpc = dataVpc.vpc;
      this.flowLogKey = dataVpc.flowLogKey;
      this.flowLogRole = dataVpc.flowLogRole;
      this.flowLogGroup = dataVpc.flowLogGroup;
      this.s3VpcEndpoint = dataVpc.s3VpcEndpoint;

      let privateSubnetIds: string [] = [];

      this.vpc.privateSubnets.forEach( function (subnet) {
        privateSubnetIds.push(subnet.subnetId);
      });

      this.emrApplicationSecurityGroup = new SecurityGroup(this, 'SecurityGroup', {
        vpc: this.vpc,
        description: `Security group used by emr serverless application ${props.name}`,
      });

      emrNetworkConfiguration = {
        securityGroupIds: [this.emrApplicationSecurityGroup.securityGroupId],
        subnetIds: privateSubnetIds,
      };
    }


    this.application = new CfnApplication(scope, `spark-serverless-application-${props.name}`, {
      ...props,
      networkConfiguration: props.networkConfiguration ?? emrNetworkConfiguration,
      releaseLabel: emrReleaseLabel,
      type: 'Spark',
    });
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

    SparkEmrServerlessRuntime.grantStartJobExecution(startJobRole, [executionRoleArn], [this.application.attrArn]);
  }

}
