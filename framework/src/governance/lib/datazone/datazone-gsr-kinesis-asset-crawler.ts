import { Duration, Stack } from 'aws-cdk-lib';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import {
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DatazoneGsrKinesisAssetCrawlerProps } from './datazone-gsr-kinesis-asset-crawler-props';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';

export class DatazoneGsrKinesisAssetCrawler extends TrackedConstruct {
  // Expose these properties publicly
  readonly domainId: string;
  readonly projectId: string;
  readonly registryName: string;
  readonly eventBridgeSchedule: Schedule | undefined;
  readonly enableSchemaRegistryEvent: boolean | undefined;
  readonly region: string;


  constructor(scope: Construct, id: string, props: DatazoneGsrKinesisAssetCrawlerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DatazoneGsrKinesisAssetCrawler.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);
    const accountId = stack.account;
    this.region = stack.region;
    this.registryName = props.registryName;
    this.domainId = props.domainId;
    this.projectId = props.projectId;
    this.enableSchemaRegistryEvent = props.enableSchemaRegistryEvent;
    this.eventBridgeSchedule = props.eventBridgeSchedule;

    const glueRegistryArn = `arn:aws:glue:${this.region}:${accountId}:registry/${props.registryName}`;
    const glueRegistrySchemasArn = `arn:aws:glue:${this.region}:${accountId}:schema/${props.registryName}/*`;

    // Define SSM Parameter paths to store asset information
    const parameterPrefix = `/datazone/${this.domainId}/${this.registryName}/asset/`;

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
                'datazone:GetAsset',
                'datazone:CreateAssetRevision',
                'datazone:DeleteAsset',
              ],
              resources: [
                `arn:aws:datazone:${this.region}:${accountId}:domain/${props.domainId}`,
                `arn:aws:datazone:${this.region}:${accountId}:project/${props.projectId}`,
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'glue:GetSchemaVersion',
                'glue:ListSchemas',
                'glue:ListSchemaVersions',
              ],
              resources: [glueRegistryArn, glueRegistrySchemasArn],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kinesis:ListStreams',
                'kinesis:DescribeStream',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:PutParameter',
                'ssm:DeleteParameter',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${accountId}:parameter${parameterPrefix}*`,
              ],
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

    const lambdaCrawler = new Function(this, 'DatazoneGSRKinesisCrawler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: handlerRole,
      timeout: Duration.minutes(5),
      code: Code.fromAsset(__dirname + '/resources/datazone-gsr-kinesis-asset-crawler/'),
      environment: {
        DOMAIN_ID: props.domainId,
        PROJECT_ID: props.projectId,
        REGION: this.region,
        REGISTRY_NAME: props.registryName,
        ACCOUNT_ID: accountId,
        PARAMETER_PREFIX: parameterPrefix,
      },
    },
    );

    lambdaCrawler.node.addDependency(membership);

    // Add EventBridge Rule for cron schedule (if provided)
    if (props.eventBridgeSchedule) {
      new Rule(this, 'ScheduledRule', {
        schedule: props.eventBridgeSchedule,
        targets: [new LambdaFunction(lambdaCrawler)],
      });
    }

    // Add EventBridge Rule for Glue Schema Registry changes (if enabled)
    if (props.enableSchemaRegistryEvent) {
      new Rule(this, 'SchemaRegistryEventRule', {
        eventPattern: {
          source: ['aws.glue'],
          detail: {
            eventSource: ['glue.amazonaws.com'],
            eventName: ['DeleteSchema', 'RegisterSchemaVersion', 'CreateSchema'],
            responseElements: {
              registryName: [props.registryName],
            },
          },
        },
        targets: [
          new LambdaFunction(lambdaCrawler, {
            event: RuleTargetInput.fromObject({ registryName: props.registryName }),
          }),
        ],
      });
    }


  }
}
