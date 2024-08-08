import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import {
  Effect,
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DataZoneMSKCustomAssetProps } from './datazone-msk-custom-asset-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export class DataZoneMSKCustomAsset extends TrackedConstruct {
  readonly createLogGroup: ILogGroup;
  readonly createFunction: IFunction;
  readonly createRole: IRole;
  readonly statusLogGroup: ILogGroup;
  readonly statusFunction: IFunction;
  readonly statusRole: IRole;
  readonly serviceToken: string;
  readonly domainId: string;
  readonly projectId: string;
  readonly name: string;
  readonly removalPolicy?: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneMSKCustomAssetProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMSKCustomAsset.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    // Validation logic
    if (props.latestVersion && props.schemaVersion) {
      throw new Error('If latestVersion is true, schemaVersionNumber cannot be provided.');
    }

    if (props.schemaArn && (props.registryName || props.schemaName)) {
      throw new Error('If schemaArn is provided, neither registryName nor schemaName can be provided.');
    }

    if (props.registryName && !props.schemaName) {
      throw new Error('If registryName is provided, schemaName must also be provided.');
    }

    const handlerRole = new Role(this, 'HandlerRole', {
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
                'datazone:CreateAsset',
                'datazone:CreateAssetType',
                'datazone:CreateFormType',
                'datazone:GetAssetType',
                'datazone:GetFormType',
                'glue:GetSchemaVersion',
                'glue:ListSchemaVersions',
                'datazone:CreateAssetRevision',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const membership = new CfnProjectMembership(this, 'ProjectMembership', {
      designation: 'PROJECT_CONTRIBUTOR',
      domainIdentifier: props.domainId,
      projectIdentifier: props.projectId,
      member: {
        userIdentifier: handlerRole.roleArn,
      },
    });

    handlerRole.applyRemovalPolicy(this.removalPolicy);

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'DataZoneMSKCustomAsset',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname + '/resources/datazone-msk-custom-asset/package-lock.json',
        entryFile: __dirname + '/resources/datazone-msk-custom-asset/index.mjs',
        handler: 'index.handler',
        iamRole: handlerRole,
        timeout: Duration.minutes(5),
      },
      removalPolicy: this.removalPolicy,
    });

    this.createLogGroup = provider.onEventHandlerLogGroup;
    this.createFunction = provider.onEventHandlerFunction;
    this.createRole = provider.onEventHandlerRole;
    this.statusLogGroup = provider.isCompleteHandlerLog!;
    this.statusFunction = provider.isCompleteHandlerFunction!;
    this.statusRole = provider.isCompleteHandlerRole!;
    this.serviceToken = provider.serviceToken;

    // Get region and account ID from the current stack
    const stack = Stack.of(this);
    const region = stack.region;
    const accountId = stack.account;

    const crResp = new CustomResource(this, 'CustomResource', {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        domainId: props.domainId,
        accountId: accountId,
        region: region,
        schemaName: props.schemaName,
        registryName: props.registryName,
        projectId: props.projectId,
        includeSchema: props.includeSchema,
        topicName: props.topicName,
        clusterName: props.clusterName,
        schemaArn: props.schemaArn,
        latestVersion: props.latestVersion,
        schemaVersionNumber: props.schemaVersion,
        sourceIdentifier: props.sourceIdentifier,
        schemaDefinition: props.schemaDefinition,
      },
    });

    crResp.node.addDependency(membership);

    // Expose the properties
    this.domainId = crResp.getAttString('domainId');
    this.projectId = props.projectId;
    this.name = crResp.getAttString('name');
  }
}
