import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
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
import { DataZoneFormTypeProps } from './datazone-form-type-props';
import { buildModelString } from './datazone-model-builder';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export class DataZoneFormType extends TrackedConstruct {
  private readonly removalPolicy: RemovalPolicy;

  readonly createLogGroup: ILogGroup;
  readonly createFunction: IFunction;
  readonly createRole: IRole;
  readonly statusLogGroup: ILogGroup;
  readonly statusFunction: IFunction;
  readonly statusRole: IRole;
  readonly serviceToken: string;
  // Exposed properties
  readonly domainId: string;
  readonly projectId: string;
  readonly name: string;
  readonly model: string;
  readonly revision: string;
  constructor(scope: Construct, id: string, props: DataZoneFormTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneFormType.name,
    };

    super(scope, id, trackedConstructProps);

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
                'datazone:CreateFormType',
                'datazone:DeleteFormType',
                'datazone:GetFormType',
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
      providerName: 'DataZoneFormType',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/resources/dz-form-type/package-lock.json',
        entryFile: __dirname+'/resources/dz-form-type/index.mjs',
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

    const modelString = buildModelString(props.name, props.fields);

    const crResp = new CustomResource(this, 'CustomResource', {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        roleArn: handlerRole.roleArn,
        domainId: props.domainId,
        projectId: props.projectId,
        name: props.name,
        model: modelString,
      },
    });

    crResp.node.addDependency(membership);
    // Optionally, you can expose the properties here if needed
    // Expose the properties
    this.domainId = crResp.getAttString('domainId');
    this.projectId = props.projectId;
    this.name = crResp.getAttString('name');
    this.model = modelString;
    this.revision = crResp.getAttString('revision');

    // You might want to handle these values or expose them in some way
    // For example, setting as class properties or returning as part of construct initialization
  }
  // Static method to get the CDK deployment role
  // eslint-disable-next-line @typescript-eslint/member-ordering
}
