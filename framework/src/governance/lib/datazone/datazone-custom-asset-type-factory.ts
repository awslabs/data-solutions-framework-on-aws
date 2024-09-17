// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DataZoneCustomAssetTypeProps } from './datazone-custom-asset-type-props';
import { DataZoneHelpers } from './datazone-helpers';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * Properties for the DataZoneCustomAssetTypeFactory construct
 */
export interface DataZoneCustomAssetTypeFactoryProps {
  /**
   * The DataZone domain identifier
   */
  readonly domainId: string;
  /**
   * The removal policy for the custom resource
   * @default RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * Interface representing a DataZone custom asset type
 */
export interface CustomAssetType {
  /**
   * The domain identifier of the custom asset type
   */
  readonly domainId: string;
  /**
   * The name of the custom asset type
   */
  readonly name: string;
  /**
   * The project identifier owner of the custom asset type
   */
  readonly projectIdentifier: string;
  /**
   * The revision of the custom asset type
   */
  readonly revision: string;
}

/**
 * Factory construct providing resources to create a DataZone custom asset type.
 *
 * @example
 * new dsf.governance.DataZoneCustomAssetTypeFactory(this, 'CustomAssetTypeFactory', {
 *  domainId: 'aba_dc999t9ime9sss',
 * });
 *
 */
export class DataZoneCustomAssetTypeFactory extends TrackedConstruct {
  /**
   * The CloudWatch Logs Log Group for the DataZone custom asset type creation
   */
  readonly createLogGroup: ILogGroup;
  /**
   * The Lambda Function for the DataZone custom asset type creation
   */
  readonly createFunction: IFunction;
  /**
   * The IAM Role for the DataZone custom asset type creation
   */
  readonly createRole: IRole;
  /**
   * The service token for the custom resource
   */
  readonly serviceToken: string;
  /**
   * The role used by the custom resource
   */
  readonly handlerRole: IRole;

  private readonly domainId: string;
  private readonly removalPolicy: RemovalPolicy;

  /**
   * Constructs a new instance of DataZoneCustomAssetTypeFactory
   * @param scope the Scope of the CDK Construct
   * @param id the ID of the CDK Construct
   * @param props The DataZoneCustomAssetTypeFactory properties
   */
  constructor(scope: Construct, id: string, props: DataZoneCustomAssetTypeFactoryProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneCustomAssetTypeFactory.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);

    this.domainId = props.domainId;

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.handlerRole = new Role(this, 'HandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DataZonePermission: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'datazone:CreateFormType',
                'datazone:CreateAssetType',
                'datazone:DeleteAssetType',
                'datazone:DeleteFormType',
                'datazone:GetFormType',
              ],
              resources: [`arn:${stack.partition}:datazone:${stack.region}:${stack.account}:domain/${this.domainId}`],
            }),
          ],
        }),
      },
    });

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'DataZoneCustomAssetType',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/resources/datazone-custom-asset-type/package-lock.json',
        entryFile: __dirname+'/resources/datazone-custom-asset-type/index.mjs',
        handler: 'index.handler',
        iamRole: this.handlerRole,
        timeout: Duration.minutes(2),
      },
      removalPolicy: this.removalPolicy,
    });

    this.createLogGroup = provider.onEventHandlerLogGroup;
    this.createFunction = provider.onEventHandlerFunction;
    this.createRole = provider.onEventHandlerRole;
    this.serviceToken = provider.serviceToken;
  }

  /**
   * Creates a DataZone custom asset type based on the provided properties
   * @param id the ID of the CDK Construct
   * @param customAssetType the properties of the custom asset type
   * @returns the custom asset type
   */
  public createCustomAssetType(id: string, customAssetType: DataZoneCustomAssetTypeProps): CustomAssetType {

    // create a project membership for the custom resource role so it can create custom asset types in this project
    const projMembership = new CfnProjectMembership(this, `${id}ProjectMembership`, {
      designation: 'PROJECT_OWNER',
      domainIdentifier: this.domainId,
      member: {
        userIdentifier: this.handlerRole.roleArn,
      },
      projectIdentifier: customAssetType.projectId,
    });

    // The custom resource creating the custom asset type
    const crResp = new CustomResource(this, id, {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        domainId: this.domainId,
        projectId: customAssetType.projectId,
        // we build the smithy model based on typescript props
        formTypes: customAssetType.formTypes.map( formType => { return { ...formType, model: DataZoneHelpers.buildModelString(formType) };}),
        assetTypeName: customAssetType.assetTypeName,
        assetTypeDescription: customAssetType.assetTypeDescription,
      },
      resourceType: 'Custom::DataZoneCustomAssetType',
    });

    crResp.node.addDependency(projMembership);

    return {
      domainId: crResp.getAttString('domainId'),
      name: crResp.getAttString('name'),
      projectIdentifier: crResp.getAttString('owningProjectId'),
      revision: crResp.getAttString('revision'),
    };
  }
}