import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { CreateDataZoneCustomAssetTypeProps, DataZoneCustomAssetTypeProps } from './datazone-custom-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export interface CustomAssetType {
  readonly domainIdentifier: string;
  readonly name: string;
  readonly projectIdentifier: string;
  readonly revision: string;
}

export class DataZoneCustomAssetTypeFactory extends TrackedConstruct {
  /**
   * The CloudWatch Logs Log Group for the Redshift Serverless creation
   */
  readonly createLogGroup: ILogGroup;
  /**
   * The Lambda Function for the Redshift Serverless creation
   */
  readonly createFunction: IFunction;
  /**
   * The IAM Role for the Redshift Serverless creation
   */
  readonly createRole: IRole;
  /**
   * The CloudWatch Logs Log Group for the creation status check
   */
  readonly statusLogGroup: ILogGroup;
  /**
   * The Lambda Function for the creation status check
   */
  readonly statusFunction: IFunction;
  /**
   * The IAM Role for the creation status check
   */
  readonly statusRole: IRole;

  readonly serviceToken: string;


  /**
   * The role used by the custom resource
   */
  readonly handlerRole: IRole;

  private readonly removalPolicy: RemovalPolicy;
  constructor(scope: Construct, id: string, props: DataZoneCustomAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneCustomAssetTypeFactory.name,
    };

    super(scope, id, trackedConstructProps);
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
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.handlerRole.applyRemovalPolicy(this.removalPolicy);

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'DataZoneCustomAssetType',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/resources/datazone-custom-asset-type/package-lock.json',
        entryFile: __dirname+'/resources/datazone-custom-asset-type/index.mjs',
        handler: 'index.handler',
        iamRole: this.handlerRole,
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
  }

  // TODO remove interface as parameter?
  public createCustomAssetType(id: string, customAssetType: CreateDataZoneCustomAssetTypeProps): CustomAssetType {
    const projMembership = new CfnProjectMembership(this, `dz-handler-${customAssetType.domainId}-${customAssetType.projectId}-membership`, {
      designation: 'PROJECT_OWNER',
      domainIdentifier: customAssetType.domainId,
      member: {
        userIdentifier: this.handlerRole.roleArn,
      },
      projectIdentifier: customAssetType.projectId,
    });

    const crResp = new CustomResource(this, id, {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        domainId: customAssetType.domainId,
        projectId: customAssetType.projectId,
        formTypes: customAssetType.formTypes,
        assetTypeName: customAssetType.assetTypeName,
        assetTypeDescription: customAssetType.assetTypeDescription,
      },
      resourceType: 'Custom::DataZoneCustomAssetType',
    });

    crResp.node.addDependency(projMembership);

    return {
      domainIdentifier: crResp.getAttString('domainId'),
      name: crResp.getAttString('name'),
      projectIdentifier: crResp.getAttString('owningProjectId'),
      revision: crResp.getAttString('revision'),
    };
  }
}