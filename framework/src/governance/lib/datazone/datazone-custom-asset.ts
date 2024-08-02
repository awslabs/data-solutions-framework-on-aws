import {CustomResource, Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
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
import { DataZoneCustomAssetProps } from './datazone-custom-asset-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

export class DataZoneCustomAsset extends TrackedConstruct {
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
  readonly typeIdentifier: string;
  readonly formsInput: {
    formName: string;
    content: string;
    typeIdentifier: string;
    typeRevision?: string;
  }[];
  readonly description?: string;
  readonly externalIdentifier?: string;
  readonly glossaryTerms?: string[];
  readonly predictionConfiguration?: {
    businessNameGeneration?: {
      enabled: boolean;
    };
  };
  readonly typeRevision?: string;
  readonly removalPolicy?: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneCustomAssetProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneCustomAsset.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

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
                'datazone:DeleteAsset',
                'datazone:GetAsset',
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
      providerName: 'DataZoneCustomAsset',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname + '/resources/datazone-custom-asset/package-lock.json',
        entryFile: __dirname + '/resources/datazone-custom-asset/index.mjs',
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

    // Initialize properties from props
    this.typeIdentifier = props.typeIdentifier;
    this.formsInput = props.formsInput;

    // Fetch region and account ID from scope
    const region = Stack.of(this).region;
    const accountId = Stack.of(this).account;

    // Optionally build the ARN if clusterName and topicName are provided
    if (props.clusterName && props.topicName) {
      this.externalIdentifier = buildMskTopicArn(region, accountId, props.clusterName, props.topicName);
    }

    const crResp = new CustomResource(this, 'CustomResource', {
      serviceToken: this.serviceToken,
      removalPolicy: this.removalPolicy,
      properties: {
        roleArn: handlerRole.roleArn,
        domainId: props.domainId,
        projectId: props.projectId,
        typeIdentifier: props.typeIdentifier,
        name: props.name,
        description: props.description,
        externalIdentifier: this.externalIdentifier,
        glossaryTerms: props.glossaryTerms,
        predictionConfiguration: props.predictionConfiguration,
        typeRevision: props.typeRevision,
        formsInput: props.formsInput,
      },
    });

    crResp.node.addDependency(membership);

    // Expose the properties
    this.domainId = crResp.getAttString('domainId');
    this.projectId = props.projectId;
    this.name = crResp.getAttString('name');
  }
}

/**
 * Generates an ARN for an Amazon MSK topic.
 *
 * @param region - The AWS region where the MSK cluster is located.
 * @param accountId - The AWS account ID.
 * @param clusterName - The name of the MSK cluster.
 * @param topicName - The name of the Kafka topic.
 * @returns The ARN string for the MSK topic.
 */
function buildMskTopicArn(region: string, accountId: string, clusterName: string, topicName: string): string {
  return `arn:aws:kafka:${region}:${accountId}:topic/${clusterName}/${topicName}`;
}