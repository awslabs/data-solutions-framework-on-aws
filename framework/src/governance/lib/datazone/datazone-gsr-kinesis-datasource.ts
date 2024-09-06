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
import { DatazoneGsrKinesisDatasourceProps } from './datazone-gsr-kinesis-datasource-props';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A DataZone GSR (Governance, Security, and Reporting) datasource for Kinesis Streams.
 *
 * @example
 * new dsf.governance.DatazoneGsrKinesisDatasource(this, 'KinesisDatasource', {
 *   domainId: 'aba_dc999t9ime9sss',
 *   projectId: '999999b3m5cpz',
 *   registryName: 'myRegistry',
 *   eventBridgeSchedule: Schedule.cron({ minute: '0', hour: '12' }), // Trigger daily at noon
 *   enableSchemaRegistryEvent: true, // Enable events for Glue Schema Registry changes
 * });
 */
export class DatazoneGsrKinesisDatasource extends TrackedConstruct {
  /**
   * The DataZone domain identifier.
   */
  readonly domainId: string;

  /**
   * The project identifier for the Kinesis datasource.
   */
  readonly projectId: string;

  /**
   * The name of the Glue schema registry.
   */
  readonly registryName: string;

  /**
   * The schedule for EventBridge rules to trigger the Lambda function.
   * @default - No schedule is set.
   */
  readonly eventBridgeSchedule: Schedule | undefined;

  /**
   * Flag to enable EventBridge rule for Glue Schema Registry events.
   * @default - false, meaning the EventBridge rule for schema registry changes is disabled.
   */
  readonly enableSchemaRegistryEvent: boolean | undefined;

  /**
   * The AWS region where resources are deployed.
   */
  readonly region: string;

  constructor(scope: Construct, id: string, props: DatazoneGsrKinesisDatasourceProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DatazoneGsrKinesisDatasource.name,
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

    // Create IAM role for Lambda function
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

    // Define project membership
    const membership = new CfnProjectMembership(this, 'ProjectMembership', {
      designation: 'PROJECT_CONTRIBUTOR',
      domainIdentifier: props.domainId,
      projectIdentifier: props.projectId,
      member: {
        userIdentifier: handlerRole.roleArn,
      },
    });

    // Define Lambda function for processing Kinesis data
    const lambdaCrawler = new Function(this, 'DatazoneGSRKinesisDatasource', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: handlerRole,
      timeout: Duration.minutes(5),
      code: Code.fromAsset(__dirname + '/resources/datazone-gsr-kinesis-datasource/'),
      environment: {
        DOMAIN_ID: props.domainId,
        PROJECT_ID: props.projectId,
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

    // Rule for RegisterSchemaVersion
    new Rule(this, 'RegisterSchemaVersionRule', {
      ruleName: 'RegisterSchemaVersionRule',
      eventPattern: {
        source: ['aws.glue'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['glue.amazonaws.com'],
          eventName: ['RegisterSchemaVersion'],
          requestParameters: {
            schemaId: {
              registryName: [props.registryName],
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
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['glue.amazonaws.com'],
          eventName: ['DeleteSchema'],
          requestParameters: {
            schemaId: {
              schemaArn: [{
                prefix: `arn:aws:glue:${this.region}:${accountId}:schema/${props.registryName}/*`,
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