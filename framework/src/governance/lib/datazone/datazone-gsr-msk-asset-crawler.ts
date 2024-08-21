import { Duration, Stack } from 'aws-cdk-lib';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
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
import { DatazoneGsrMskAssetCrawlerProps } from './datazone-gsr-msk-asset-crawler-props';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class DatazoneGsrMskAssetCrawler extends TrackedConstruct {


  constructor(scope: Construct, id: string, props: DatazoneGsrMskAssetCrawlerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DatazoneGsrMskAssetCrawler.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);
    const region = stack.region;
    const accountId = stack.account;

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
                'glue:ListSchemas',
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

    const lambdaCrawler = new Function(this, 'DatazoneGSRMSKCrawler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: handlerRole,
      timeout: Duration.minutes(5),
      code: Code.fromAsset(__dirname + '/resources/datazone-gsr-msk-asset-crawler/'),
      environment: {
        DOMAIN_ID: props.domainId,
        PROJECT_ID: props.projectId,
        CLUSTER_NAME: props.clusterName,
        REGION: region,
        REGISTRY_NAME: props.registryName,
        ACCOUNT_ID: accountId,
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
          detailType: ['Glue Schema Registry State Change'],
          detail: {
            registryName: [props.registryName],
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
