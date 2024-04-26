// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IInterfaceVpcEndpoint, ISecurityGroup, InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { RedshiftDataProps } from './redshift-data-props';
import { Context, TrackedConstruct } from '../../../../utils';

export interface RedshiftDataAccessTargetProps {
  readonly targetArn: string;
  readonly targetType: 'provisioned'|'serverless';
  readonly targetId: string;
}

export abstract class BaseRedshiftDataAccess extends TrackedConstruct {
  /**
   * The Security Group used by the Custom Resource when deployed in a VPC
   */
  public readonly customResourceSecurityGroup?: ISecurityGroup;

  /**
   * The Security Group used by the VPC Endpoint when deployed in a VPC
   */
  public readonly vpcEndpointSecurityGroup?: ISecurityGroup;

  /**
   * The created Redshift Data API interface vpc endpoint when deployed in a VPC
   */
  public readonly vpcEndpoint?: IInterfaceVpcEndpoint;

  protected readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: RedshiftDataProps, trackedConstructProps: any) {

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.vpcEndpoint?.applyRemovalPolicy(this.removalPolicy);

    if (props.vpc && props.subnets) {
      this.customResourceSecurityGroup = new SecurityGroup(this, 'CrSecurityGroup', {
        vpc: props.vpc,
      });

      if (props.createInterfaceVpcEndpoint) {
        this.vpcEndpointSecurityGroup = new SecurityGroup(this, 'InterfaceVpcEndpointSecurityGroup', {
          vpc: props.vpc,
        });

        this.vpcEndpointSecurityGroup.addIngressRule(Peer.ipv4(props.vpc.vpcCidrBlock), Port.tcp(443));

        this.vpcEndpoint = new InterfaceVpcEndpoint(this, 'InterfaceVpcEndpoint', {
          vpc: props.vpc,
          subnets: props.subnets,
          service: InterfaceVpcEndpointAwsService.REDSHIFT_DATA,
          securityGroups: [this.vpcEndpointSecurityGroup],
        });
        this.vpcEndpoint.applyRemovalPolicy(this.removalPolicy);
      } else if (props.existingInterfaceVPCEndpoint) {
        this.vpcEndpoint = props.existingInterfaceVPCEndpoint;
      }

      if (this.vpcEndpoint) {
        this.vpcEndpoint.connections.allowFrom(this.customResourceSecurityGroup, Port.tcp(443));
      }
    }
  }

  protected getDataAccessTarget(props: RedshiftDataProps): RedshiftDataAccessTargetProps {
    const currentStack = Stack.of(this);

    if (props.clusterId) {
      return {
        targetArn: `arn:${currentStack.partition}:redshift:${currentStack.region}:${currentStack.account}:cluster:${props.clusterId}`,
        targetType: 'provisioned',
        targetId: props.clusterId,
      };
    } else if (props.workgroupId) {
      return {
        targetArn: `arn:${currentStack.partition}:redshift-serverless:${currentStack.region}:${currentStack.account}:workgroup/${props.workgroupId}`,
        targetType: 'serverless',
        targetId: props.workgroupId,
      };
    } else {
      throw new Error('Either cluster identifier or workgroup id is required');
    }
  }

  protected createProviderExecutionRole(id: string, dataAccessTarget: RedshiftDataAccessTargetProps, props: RedshiftDataProps): Role {
    const role = new Role(this, id, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        RedshiftDataPermission: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'redshift-data:BatchExecuteStatement',
                'redshift-data:ExecuteStatement',
              ],
              resources: [
                dataAccessTarget.targetArn,
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'redshift-data:DescribeStatement',
                'redshift-data:CancelStatement',
                'redshift-data:GetStatementResult',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    if (props.secretKey) {
      props.secretKey.grantDecrypt(role);
    }

    props.secret.grantRead(role);

    return role;
  }
}