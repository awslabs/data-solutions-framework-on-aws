import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
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
import { GlueSchemaRegistryVersionProps } from './glue-schema-registry-version-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export class GlueSchemaRegistryVersion extends TrackedConstruct {
  private readonly removalPolicy: RemovalPolicy;

  readonly createLogGroup: ILogGroup;
  readonly createFunction: IFunction;
  readonly createRole: IRole;
  readonly statusLogGroup: ILogGroup;
  readonly statusFunction: IFunction;
  readonly statusRole: IRole;
  readonly serviceToken: string;
  // Exposed properties
  readonly schemaArn?: string;
  readonly registryName?: string;
  readonly schemaName?: string | undefined;
  readonly schemaVersionNumber?: number;
  readonly latestVersion?: boolean;

  // Response properties
  readonly schemaVersionId: string;
  readonly schemaDefinition: string;
  readonly dataFormat: string;
  readonly versionNumber: string;
  readonly status: string;
  readonly createdTime: string;
  constructor(scope: Construct, id: string, props: GlueSchemaRegistryVersionProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: GlueSchemaRegistryVersion.name,
    };

    super(scope, id, trackedConstructProps);

    // Validate props
    if (props.schemaArn && props.registryName) {
      throw new Error('You cannot specify both schemaRegistryArn and registryName. Please provide only one.');
    }

    if (!props.schemaArn && !props.registryName) {
      throw new Error('You must specify either schemaRegistryArn or registryName.');
    }


    if (props.schemaVersionNumber === undefined && props.latestVersion === undefined) {
      throw new Error('Either schemaVersionNumber or latestVersion must be provided.');
    }

    this.removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
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
                'glue:GetSchemaVersion',
                'glue:ListSchemaVersions',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    handlerRole.applyRemovalPolicy(this.removalPolicy);

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'GlueSchemaRegistryVersion',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/resources/glue-schema-version/package-lock.json',
        entryFile: __dirname+'/resources/glue-schema-version/index.mjs',
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

    this.schemaName = props.schemaName;

    const crResp = new CustomResource(this, 'CustomResource', {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        schemaArn: props.schemaArn,
        registryName: props.registryName,
        schemaName: props.schemaName,
        schemaVersionNumber: props.schemaVersionNumber,
        latestVersion: props.latestVersion,
      },
    });

    // Optionally, you can expose the properties here if needed
    // Expose the properties
    // Bind response properties to CDK construct
    this.schemaVersionId = crResp.getAttString('SchemaVersionId');
    this.schemaDefinition = crResp.getAttString('SchemaDefinition');
    this.dataFormat = crResp.getAttString('DataFormat');
    this.schemaArn = crResp.getAttString('SchemaArn');
    this.versionNumber = crResp.getAtt('VersionNumber').toString();
    this.status = crResp.getAttString('Status');
    this.createdTime = crResp.getAttString('CreatedTime');

    // You might want to handle these values or expose them in some way
    // For example, setting as class properties or returning as part of construct initialization
  }
  // Static method to get the CDK deployment role
  // eslint-disable-next-line @typescript-eslint/member-ordering
}
