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
import { DataZoneGsrMskDataSourceProps } from './datazone-gsr-msk-datasource-props';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A DataZone custom data source for MSK (Managed Streaming for Kafka) with integration for Glue Schema Registry.
 *
 * @example
 * import { Schedule } from 'aws-cdk-lib/aws-events';
 *
 * new dsf.governance.DataZoneGsrMskDataSource(this, 'MskDatasource', {
 *   domainId: 'aba_dc999t9ime9sss',
 *   projectId: '999999b3m5cpz',
 *   registryName: 'MyRegistry',
 *   clusterName: 'MyCluster',
 *   runSchedule: Schedule.cron({ minute: '0', hour: '12' }), // Trigger daily at noon
 *   enableSchemaRegistryEvent: true, // Enable events for Glue Schema Registry changes
 * });
 */
export class DataZoneGsrMskDataSource extends TrackedConstruct {

  /**
   * The IAM Role of the Lambda Function interacting with DataZone API
   */
  public readonly datasourceLambdaRole: Role;
  /**
   * The membership of the Lambda Role on the DataZone Project
   */
  public readonly dataZoneMembership: CfnProjectMembership;
  /**
   * The Event Bridge Rule for schema creation and update
   */
  public readonly createUpdateEventRule?: Rule;
  /**
   * The Event Bridge Rule for trigger the data source execution
   */
  public readonly scheduleRule?: Rule;
  /**
   * The Event Bridge Rule for schema deletion
   */
  public readonly deleteEventRule?: Rule;

  /**
   * Build an instance of the DataZoneGsrMskDataSource
   * @param scope the Scope of the CDK Construct
   * @param id the ID of the CDK Construct
   * @param props The DataZoneGsrMskDataSourceProps properties
   */
  constructor(scope: Construct, id: string, props: DataZoneGsrMskDataSourceProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneGsrMskDataSource.name,
    };

    super(scope, id, trackedConstructProps);

    const stack = Stack.of(this);
    const accountId = stack.account;
    const region = stack.region;
    const partition = stack.partition;

    const clusterArn = `arn:${partition}:kafka:${region}:${accountId}:cluster/${props.clusterName}/*`;
    const listClustersArn = `arn:${partition}:kafka:${region}:${accountId}:/api/v2/clusters`;
    const glueRegistryArn = `arn:${partition}:glue:${region}:${accountId}:registry/${props.registryName}`;
    const glueRegistrySchemasArn = `arn:${partition}:glue:${region}:${accountId}:schema/${props.registryName}/*`;

    // Define SSM Parameter paths to store asset information
    const parameterPrefix = `/datazone/${props.domainId}/${props.registryName}/asset/`;

    this.datasourceLambdaRole = new Role(this, 'HandlerRole', {
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
                `arn:${partition}:datazone:${region}:${accountId}:domain/${props.domainId}`,
                `arn:${partition}:datazone:${region}:${accountId}:project/${props.projectId}`,
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
              resources: [clusterArn],
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
                `arn:${partition}:ssm:${region}:${accountId}:parameter${parameterPrefix}*`,
              ],
            }),
          ],
        }),
      },
    });

    this.dataZoneMembership = new CfnProjectMembership(this, 'ProjectMembership', {
      designation: 'PROJECT_CONTRIBUTOR',
      domainIdentifier: props.domainId,
      projectIdentifier: props.projectId,
      member: {
        userIdentifier: this.datasourceLambdaRole.roleArn,
      },
    });

    const lambdaCrawler = new Function(this, 'DataZoneGsrMskDataSource', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: this.datasourceLambdaRole,
      timeout: Duration.minutes(5),
      code: Code.fromAsset(__dirname + '/resources/datazone-gsr-msk-datasource/'),
      environment: {
        DOMAIN_ID: props.domainId,
        PROJECT_ID: props.projectId,
        CLUSTER_NAME: props.clusterName,
        REGION: region,
        REGISTRY_NAME: props.registryName,
        ACCOUNT_ID: accountId,
        PARAMETER_PREFIX: parameterPrefix,
        PARTITION: partition,
      },
    });

    lambdaCrawler.node.addDependency(this.dataZoneMembership);

    // Add EventBridge Rule for cron schedule (if provided)
    if (props.runSchedule || props.enableSchemaRegistryEvent === undefined) {
      this.scheduleRule = new Rule(this, 'ScheduledRule', {
        schedule: props.runSchedule || Schedule.expression('cron(1 0 * * ? *)'),
        targets: [new LambdaFunction(lambdaCrawler)],
      });
    }

    // Add EventBridge Rule for Glue Schema Registry changes (if enabled)
    if (props.enableSchemaRegistryEvent) {
      this.createUpdateEventRule = new Rule(this, 'SchemaRegistryEventRule', {
        eventPattern: {
          source: ['aws.glue'],
          detail: {
            eventSource: ['glue.amazonaws.com'],
            eventName: ['CreateSchema', 'RegisterSchemaVersion'],
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

      // Rule for DeleteSchema
      this.deleteEventRule = new Rule(this, 'DeleteSchemaRule', {
        ruleName: 'DeleteSchemaRule',
        eventPattern: {
          source: ['aws.glue'],
          detail: {
            eventSource: ['glue.amazonaws.com'],
            eventName: ['DeleteSchema'],
            requestParameters: {
              schemaId: {
                schemaArn: [{
                  prefix: `arn:${partition}:glue:${region}:${accountId}:schema/${props?.registryName}/*`,
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
