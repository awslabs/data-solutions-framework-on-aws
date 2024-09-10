// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
import { DatazoneGsrMskDatasourceProps } from './datazone-gsr-msk-datasource-props';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A DataZone custom data source for MSK (Managed Streaming for Kafka) with integration for Glue Schema Registry.
 *
 * @example
 * new DatazoneGsrMskDatasource(this, 'MskDatasource', {
 *   domainId: 'aba_dc999t9ime9sss',
 *   projectId: '999999b3m5cpz',
 *   registryName: 'MyRegistry',
 *   clusterName: 'MyCluster',
 *   eventBridgeSchedule: Schedule.cron({ minute: '0', hour: '12' }), // Trigger daily at noon
 *   enableSchemaRegistryEvent: true, // Enable events for Glue Schema Registry changes
 * });
 */
export class DatazoneGsrMskDatasource extends TrackedConstruct {
  /**
   * The DataZone domain identifier
   */
  readonly domainId: string;
  /**
   * The DataZone project identifier
   */
  readonly projectId: string;
  /**
   * The Glue Schema Registry name
   */
  readonly registryName: string;
  /**
   * The schedule for EventBridge rules, if provided
   * @default - No schedule rule is created
   */
  readonly eventBridgeSchedule: Schedule | undefined;
  /**
   * Whether to enable EventBridge listener for Glue Schema Registry events
   * @default - false
   */
  readonly enableSchemaRegistryEvent: boolean | undefined;
  /**
   * The ARN of the MSK cluster
   */
  readonly clusterArn: string;
  /**
   * The name of the MSK cluster
   */
  readonly clusterName: string;
  /**
   * The AWS region where resources are deployed
   */
  readonly region: string;

  constructor(scope: Construct, id: string, props: DatazoneGsrMskDatasourceProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DatazoneGsrMskDatasource.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);
    const accountId = stack.account;
    this.region = stack.region;
    this.registryName = props.registryName;
    this.clusterName = props.clusterName;
    this.domainId = props.domainId;
    this.projectId = props.projectId;
    this.enableSchemaRegistryEvent = props.enableSchemaRegistryEvent;
    this.eventBridgeSchedule = props.eventBridgeSchedule;

    this.clusterArn = `arn:aws:kafka:${this.region}:${accountId}:cluster/${props.clusterName}/*`;
    const listClustersArn = `arn:aws:kafka:${this.region}:${accountId}:/api/v2/clusters`;
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
                'kafka:DescribeClusterV2',
              ],
              resources: [this.clusterArn],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kafka:ListClustersV2',
              ],
              resources: [listClustersArn],
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

    const lambdaCrawler = new Function(this, 'DatazoneGSRMSKDatasource', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: handlerRole,
      timeout: Duration.minutes(5),
      code: Code.fromAsset(__dirname + '/resources/datazone-gsr-msk-datasource/'),
      environment: {
        DOMAIN_ID: props.domainId,
        PROJECT_ID: props.projectId,
        CLUSTER_NAME: props.clusterName,
        REGION: this.region,
        REGISTRY_NAME: props.registryName,
        ACCOUNT_ID: accountId,
        PARAMETER_PREFIX: parameterPrefix,
      },
    });

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
            eventName: ['CreateSchema'],
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
      // Rule for RegisterSchemaVersion
      new Rule(this, 'RegisterSchemaVersionRule', {
        ruleName: 'RegisterSchemaVersionRule',
        eventPattern: {
          source: ['aws.glue'],
          detail: {
            eventSource: ['glue.amazonaws.com'],
            eventName: ['RegisterSchemaVersion'],
            requestParameters: {
              schemaId: {
                registryName: [props?.registryName],
              },
            },
          },
        },
        targets: [
          new LambdaFunction(lambdaCrawler, {
            event: RuleTargetInput.fromObject({ registryName: props.registryName }),
          }),
        ],
      });

      // Rule for DeleteSchema
      new Rule(this, 'DeleteSchemaRule', {
        ruleName: 'DeleteSchemaRule',
        eventPattern: {
          source: ['aws.glue'],
          detail: {
            eventSource: ['glue.amazonaws.com'],
            eventName: ['DeleteSchema'],
            requestParameters: {
              schemaId: {
                schemaArn: [{
                  prefix: `arn:aws:glue:${this.region}:${accountId}:schema/${props?.registryName}/*`,
                }],
              },
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
