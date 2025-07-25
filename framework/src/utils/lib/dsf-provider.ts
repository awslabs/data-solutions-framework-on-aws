// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { CustomResource, Duration, RemovalPolicy, ResourceEnvironment, Stack } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { Effect, IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Code, IFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Context } from './context';
import { DsfProviderProps, HandlerDefinition } from './dsf-provider-props';

/**
 * @internal
 */
export class DsfProvider extends Construct {

  private static readonly CR_RUNTIME = Runtime.NODEJS_22_X;
  private static readonly LOG_RETENTION = RetentionDays.ONE_WEEK;
  private static readonly FUNCTION_TIMEOUT = Duration.minutes(14);

  /**
   * The Custom Resouce Provider created
   */
  public readonly serviceToken: string;
  /**
   * The CloudWatch Log Group for the OnEventHandler Lambda Function
   */
  public readonly onEventHandlerLogGroup: ILogGroup;
  /**
   * The IAM Role for the onEventHandler Lambba Function
   */
  public readonly onEventHandlerRole: IRole;
  /**
   * The Lambda Function for the onEventHandler
   */
  public readonly onEventHandlerFunction: IFunction;
  /**
   * The CloudWatch Log Group for the isCompleteHandler Lambda Function
   */
  public readonly isCompleteHandlerLog?: ILogGroup;
  /**
   * The IAM Role for the isCompleteHandler Lambba Function
   */
  public readonly isCompleteHandlerRole?: IRole;
  /**
   * The Lambda Function for the isCompleteHandler
   */
  public readonly isCompleteHandlerFunction?: IFunction;
  /**
   * The list of EC2 Security Groups used by the Lambda Functions
   */
  public readonly securityGroups?: ISecurityGroup[];
  /**
   * The CloudWatch Log Group for the custom resource cleaning up lambda ENIs
   */
  public readonly cleanUpLogGroup?: ILogGroup;
  /**
   * The Lambda function for the custom resource cleaning up lambda ENIs
   */
  public readonly cleanUpFunction?: IFunction;
  /**
   * The IAM Role for the cleanUp Lambba Function
   */
  public readonly cleanUpRole?: IRole;

  private readonly removalPolicy: RemovalPolicy;
  private readonly accountInfo: ResourceEnvironment;
  private readonly subnets?: SubnetSelection;
  private readonly cleanUpCr?: CustomResource;
  private readonly vpcPolicy?: ManagedPolicy;
  private readonly vpc?: IVpc;


  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.accountInfo = {
      account: Stack.of(this).account,
      region: Stack.of(this).region,
    };

    this.onEventHandlerRole = props.onEventHandlerDefinition.iamRole ?? this.createLambdaExecutionRole ('OnEventHandlerRole');

    // If there is a managed policy to attach we do it
    if (props.onEventHandlerDefinition.managedPolicy) {

      this.onEventHandlerRole.addManagedPolicy(props.onEventHandlerDefinition.managedPolicy);
    }

    // Create the CloudWatch Log Groups and atached required permissions for logging
    this.onEventHandlerLogGroup = this.createLogGroup('OnEventHandlerLogGroup');
    this.onEventHandlerLogGroup.grantWrite(this.onEventHandlerRole);

    // If the Lambda is deployed within a VPC, we attached required permissions
    if (props.vpc) {

      this.vpc = props.vpc;
      this.subnets = props.subnets ?? props.vpc.selectSubnets();
      this.securityGroups = props.securityGroups ?? [new SecurityGroup(this, 'LambdaSecurityGroup', {
        vpc: props.vpc,
        allowAllOutbound: true,
      })];
      //create the policy used by lambdas
      this.vpcPolicy = this.getVpcPermissions();

      this.onEventHandlerRole.addManagedPolicy(this.vpcPolicy);

      // grant encrypt & decrypt to onEventHandlerRole for Env encryption KMS Key
      props.environmentEncryption?.grantEncryptDecrypt(this.onEventHandlerRole);

      // add a dependency to avoid race condition when deleting the stack
      this.onEventHandlerRole.node.addDependency(this.vpcPolicy);

      // Create the custom resource for cleaning up the ENIs used by Lambda functions
      this.cleanUpRole = this.createLambdaExecutionRole ('CleanUpRole');
      this.cleanUpRole.addManagedPolicy(this.vpcPolicy);
      // add a dependency to avoid race condition when deleting the stack
      this.cleanUpRole.node.addDependency(this.vpcPolicy);

      this.cleanUpLogGroup = this.createLogGroup('CleanUpLogGroup');
      this.cleanUpLogGroup.grantWrite(this.cleanUpRole);

      props.environmentEncryption?.grantEncryptDecrypt(this.cleanUpRole);

      this.cleanUpFunction = new Function(this, 'CleanUpLambda', {
        runtime: DsfProvider.CR_RUNTIME,
        role: this.cleanUpRole,
        logGroup: this.cleanUpLogGroup,
        handler: 'index.handler',
        code: Code.fromAsset(path.join(__dirname, './resources/lambda/dsf-provider/')),
        timeout: Duration.minutes(2),
        environment: {
          SECURITY_GROUPS: this.securityGroups!.map(s => s.securityGroupId).join(','),
          SUBNETS: this.subnets.subnets!.map(s => s.subnetId).join(','),
        },
        environmentEncryption: props.environmentEncryption,
      });

      const cleanUpProvider = new Provider(this, 'CleanUpProvider', {
        onEventHandler: this.cleanUpFunction,
        logRetention: DsfProvider.LOG_RETENTION,
        providerFunctionEnvEncryption: props.environmentEncryption,
      });

      this.cleanUpCr = new CustomResource(this, 'CleanUpCustomResource', {
        serviceToken: cleanUpProvider.serviceToken,
        resourceType: 'Custom::LambdaEniCleanup',
      });
    }

    this.onEventHandlerFunction = this.createHandler('OnEventHandlerFunction', props.onEventHandlerDefinition, this.onEventHandlerLogGroup, this.onEventHandlerRole);

    // Dependency to schedule the ENI cleanup after lambda deletion
    if (props.vpc) {
      this.onEventHandlerFunction.node.addDependency(this.cleanUpCr!);
    };

    if (props.isCompleteHandlerDefinition) {
      this.isCompleteHandlerRole = props.isCompleteHandlerDefinition.iamRole ?? this.createLambdaExecutionRole ('IsCompleteHandlerRole');

      // If there is a managed policy to attach we do it
      if (props.isCompleteHandlerDefinition.managedPolicy) {
        this.isCompleteHandlerRole.addManagedPolicy(props.isCompleteHandlerDefinition.managedPolicy);
      }

      // Create the CloudWatch Log Groups and atached required permissions for logging
      this.isCompleteHandlerLog = this.createLogGroup ('IsCompleteHandlerLogGroup');
      this.isCompleteHandlerLog.grantWrite(this.isCompleteHandlerRole);

      this.isCompleteHandlerFunction = this.createHandler('IsCompleteHandlerFunction', props.isCompleteHandlerDefinition, this.isCompleteHandlerLog, this.isCompleteHandlerRole);

      if (props.vpc) {
        this.isCompleteHandlerRole.addManagedPolicy(this.vpcPolicy!);
        // add a dependency to avoid race condition when deleting the stack
        this.isCompleteHandlerRole.node.addDependency(this.vpcPolicy!);
        // Dependency to schedule the ENI cleanup after lambda deletion
        this.isCompleteHandlerFunction.node.addDependency(this.cleanUpCr!);
      }

      // grant encrypt & decrypt to onEventHandlerRole for Env encryption KMS Key
      props.environmentEncryption?.grantEncryptDecrypt(this.isCompleteHandlerRole);
    }


    const customResourceProvider = new Provider (this, 'CustomResourceProvider', {
      onEventHandler: this.onEventHandlerFunction,
      isCompleteHandler: this.isCompleteHandlerFunction ?? undefined,
      queryInterval: props.queryInterval,
      vpc: props.vpc,
      vpcSubnets: this.subnets,
      securityGroups: this.securityGroups,
      totalTimeout: props.queryTimeout,
      logRetention: DsfProvider.LOG_RETENTION,
      providerFunctionEnvEncryption: props.environmentEncryption,
    });

    // Scope down the `onEventHandlerFunction` to be called
    // Only by the function created by the Provider
    this.onEventHandlerFunction.addPermission('InvokePermissionOnEvent', {
      principal: new ServicePrincipal('lambda.amazonaws.com'),
      sourceArn: customResourceProvider.serviceToken,
    });

    // Scope down the `isCompleteHandlerFunction` to be called
    // Only by the function created by the Provider
    if (this.isCompleteHandlerFunction) {
      let frameworkOnIsCompleteFunction = customResourceProvider.node.findChild('framework-isComplete') as Function;

      this.isCompleteHandlerFunction.addPermission('InvokePermissionIsComplete', {
        principal: new ServicePrincipal('lambda.amazonaws.com'),
        sourceArn: frameworkOnIsCompleteFunction.functionArn,
      });
    }

    this.serviceToken = customResourceProvider.serviceToken;
  }

  private createLambdaExecutionRole(id: string): Role {

    return new Role (this, id, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
  }

  private createLogGroup(id: string) : ILogGroup {

    const logGroup: LogGroup = new LogGroup (this, id, {
      retention: DsfProvider.LOG_RETENTION,
      removalPolicy: this.removalPolicy,
    });

    return logGroup;
  }

  private createHandler(id: string, props: HandlerDefinition, logGroup: ILogGroup, role: IRole): Function {

    return new NodejsFunction (this, id, {
      runtime: DsfProvider.CR_RUNTIME,
      handler: props.handler,
      entry: props.entryFile,
      depsLockFilePath: props.depsLockFilePath,
      logGroup: logGroup,
      role: role,
      bundling: props.bundling,
      environment: {
        ...props.environment,
        DSF_RUNTIME_VERSION: DsfProvider.CR_RUNTIME.toString(),
      },
      timeout: props.timeout ?? DsfProvider.FUNCTION_TIMEOUT,
      vpc: this.vpc,
      vpcSubnets: this.subnets,
      securityGroups: this.securityGroups,
      environmentEncryption: props.environmentEncryption,
    });
  }

  private getVpcPermissions(): ManagedPolicy {

    const securityGroupArns = this.securityGroups!.map(sg => `arn:aws:ec2:${this.accountInfo.region}:${this.accountInfo.account}:security-group/${sg.securityGroupId}`);
    const subnetArns = this.subnets!.subnets!.map(s => `arn:aws:ec2:${this.accountInfo.region}:${this.accountInfo.account}:subnet/${s.subnetId}`);

    const lambdaVpcPolicy = new ManagedPolicy( this, 'VpcPolicy', {
      statements: [
        new PolicyStatement({
          actions: [
            'ec2:DescribeNetworkInterfaces',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
          conditions: {
            StringEquals: {
              'aws:RequestedRegion': this.accountInfo.region,
            },
          },
        }),
        new PolicyStatement({
          actions: [
            'ec2:DeleteNetworkInterface',
            'ec2:AssignPrivateIpAddresses',
            'ec2:UnassignPrivateIpAddresses',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
          conditions: {
            StringEqualsIfExists: {
              'ec2:Subnet': subnetArns,
            },
          },
        }),
        new PolicyStatement({
          actions: [
            'ec2:CreateNetworkInterface',
          ],
          effect: Effect.ALLOW,
          resources: [
            `arn:aws:ec2:${this.accountInfo.region}:${this.accountInfo.account}:network-interface/*`,
          ].concat(subnetArns, securityGroupArns),
        }),
      ],
    });
    return lambdaVpcPolicy;
  }
}