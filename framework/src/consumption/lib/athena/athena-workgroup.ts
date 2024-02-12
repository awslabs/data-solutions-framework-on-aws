// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack, RemovalPolicy } from 'aws-cdk-lib';

import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';
import { Effect, IPrincipal, PolicyStatement, Role, IRole, ServicePrincipal, PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { ENGINE_DEFAULT_VERSION, EngineVersion, WORKGROUP_DEFAULT_STATE } from './athena-workgroup-config';
import { AthenaWorkgroupProps } from './athena-workgroup-props';
import { AnalyticsBucketProps } from '../../../storage';
import { AnalyticsBucket } from '../../../storage/lib/analytics-bucket';
import { BucketUtils, Context, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';


/**
 * An Amazon Athena Workgroup configured with default result bucket.
 *
 * @example
 * new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupDefault', {
 *    name: 'athena-default',
 *    resultLocationPrefix: 'athena-default-results/'
 *  })
 */
export class AthenaWorkGroup extends TrackedConstruct {
  /**
   * Athena Workgroup that is created.
   */
  public readonly workGroup: CfnWorkGroup;
  /**
   * WorkGroup name with the randomized suffix.
   */
  public readonly workGroupName: string;
  /**
   * S3 Bucket used for query results.
   */
  public readonly resultBucket: IBucket;
  /**
   * KMS Key to encrypt the query results.
   */
  public readonly resultsEncryptionKey: IKey;
  /**
   * Role used to access user resources in an Athena for Apache Spark session.
   */
  public readonly executionRole?: IRole;
  /**
   * Constructor properties for internal use.
   */
  private athenaWorkGroupProps: AthenaWorkgroupProps;

  constructor(scope: Construct, id: string, props: AthenaWorkgroupProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: AthenaWorkGroup.name,
    };
    super(scope, id, trackedConstructProps);

    const currentStack = Stack.of(this);
    const removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);
    this.athenaWorkGroupProps = props;

    if (props?.resultBucket) {
      if (!props?.resultsEncryptionKey) {
        throw new Error('Encryption key is required if you are providing your own results bucket.');
      }
      this.resultBucket = props.resultBucket;
      this.resultsEncryptionKey = props.resultsEncryptionKey;
    } else {
      this.resultsEncryptionKey = props?.resultsEncryptionKey || new Key(this, 'AthenaResultKey', {
        removalPolicy,
        enableKeyRotation: true,
      });

      let resultBucketProps: AnalyticsBucketProps = {
        bucketKeyEnabled: true,
        encryptionKey: this.resultsEncryptionKey,
        bucketName: props?.resultBucketName || BucketUtils.generateUniqueBucketName(this, 'AthenaBucket', 'athena'),
        removalPolicy,
      };

      if (props.resultsRetentionPeriod) {
        resultBucketProps = {
          ...resultBucketProps,
          lifecycleRules: [
            {
              expiration: props.resultsRetentionPeriod,
            },
          ],
        };
      }
      this.resultBucket = new AnalyticsBucket(this, 'AthenaBucket', resultBucketProps);
    }

    let resultLocationPrefix = props.resultLocationPrefix;
    if (!resultLocationPrefix.endsWith('/')) {
      resultLocationPrefix += '/';
    }

    const engineVersion: CfnWorkGroup.EngineVersionProperty = {
      selectedEngineVersion: props?.engineVersion || ENGINE_DEFAULT_VERSION,
    };

    let workGroupConfiguration: CfnWorkGroup.WorkGroupConfigurationProperty = {
      enforceWorkGroupConfiguration: props?.enforceWorkGroupConfiguration || true,
      engineVersion,
      requesterPaysEnabled: props?.requesterPaysEnabled || false,
      publishCloudWatchMetricsEnabled: props?.publishCloudWatchMetricsEnabled || true,
      resultConfiguration: {
        outputLocation: this.resultBucket.s3UrlForObject(resultLocationPrefix),
        encryptionConfiguration: {
          encryptionOption: 'SSE_KMS',
          kmsKey: this.resultsEncryptionKey.keyArn,
        },
      },
    };

    if (props?.bytesScannedCutoffPerQuery) {
      workGroupConfiguration = {
        ...workGroupConfiguration,
        bytesScannedCutoffPerQuery: props.bytesScannedCutoffPerQuery,
      };
    }

    const hash = Utils.generateUniqueHash(this);
    this.workGroupName = props.name + '_' + hash.toLowerCase();
    const logGroup = `arn:aws:logs:${currentStack.region}:${currentStack.account}:log-group`;

    const executionRoleStatements = [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'athena:GetWorkGroup',
          'athena:TerminateSession',
          'athena:GetSession',
          'athena:GetSessionStatus',
          'athena:ListSessions',
          'athena:StartCalculationExecution',
          'athena:GetCalculationExecutionCode',
          'athena:StopCalculationExecution',
          'athena:ListCalculationExecutions',
          'athena:GetCalculationExecution',
          'athena:GetCalculationExecutionStatus',
          'athena:ListExecutors',
          'athena:ExportNotebook',
          'athena:UpdateNotebook',
        ],
        resources: [
          `arn:aws:athena:${currentStack.region}:${currentStack.account}:workgroup/${this.workGroupName}`,
        ],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:DescribeLogStreams',
          'logs:PutLogEvents',
        ],
        resources: [
          `${logGroup}:/aws-athena:*`,
          `${logGroup}:/aws-athena*:log-stream:*`,
        ],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:DescribeLogGroups',
        ],
        resources: [
          `${logGroup}:*`,
        ],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'AmazonAthenaForApacheSpark',
          },
        },
      }),
    ];

    if (props?.engineVersion === EngineVersion.PYSPARK_V3) {
      if (props.executionRole) {
        this.executionRole = props.executionRole;
        workGroupConfiguration = {
          ...workGroupConfiguration,
          executionRole: this.executionRole.roleArn,
        };
      } else {
        this.executionRole = new Role(this, 'AthenaSparkSessionRole', {
          assumedBy: new ServicePrincipal('athena.amazonaws.com'),
          inlinePolicies: {
            athenaSparkPolicies: new PolicyDocument({
              statements: executionRoleStatements,
            }),
          },
        });
        this.resultsEncryptionKey.grantEncryptDecrypt(this.executionRole);
        this.resultBucket.grantReadWrite(this.executionRole, resultLocationPrefix);

        workGroupConfiguration = {
          ...workGroupConfiguration,
          executionRole: this.executionRole.roleArn,
        };
      }
    }

    this.workGroup = new CfnWorkGroup(this, 'AthenaWorkGroup', {
      state: props?.state || WORKGROUP_DEFAULT_STATE,
      name: this.workGroupName,
      workGroupConfiguration,
      recursiveDeleteOption: removalPolicy == RemovalPolicy.DESTROY ? true : false,
    });
  }

  /**
   * Grants running queries access to Principal.
   * @param principal Principal to attach query access to Athena Workgroup.
   */
  public grantRunQueries(principal: IPrincipal) {
    const currentStack = Stack.of(this);

    let resultLocationPrefix = this.athenaWorkGroupProps.resultLocationPrefix;
    if (!resultLocationPrefix.endsWith('/')) {
      resultLocationPrefix += '/';
    }
    this.resultBucket.grantReadWrite(principal, resultLocationPrefix);
    this.resultsEncryptionKey.grantEncryptDecrypt(principal);

    principal.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'athena:ListEngineVersions',
        'athena:ListWorkGroups',
        'athena:ListDataCatalogs',
        'athena:ListDatabases',
        'athena:GetDatabase',
        'athena:ListTableMetadata',
        'athena:GetTableMetadata',
      ],
      resources: ['*'],
    }));

    principal.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'athena:GetWorkGroup',
        'athena:BatchGetQueryExecution',
        'athena:GetQueryExecution',
        'athena:ListQueryExecutions',
        'athena:StartQueryExecution',
        'athena:StopQueryExecution',
        'athena:GetQueryResults',
        'athena:GetQueryResultsStream',
        'athena:CreateNamedQuery',
        'athena:GetNamedQuery',
        'athena:BatchGetNamedQuery',
        'athena:ListNamedQueries',
        'athena:DeleteNamedQuery',
        'athena:CreatePreparedStatement',
        'athena:GetPreparedStatement',
        'athena:ListPreparedStatements',
        'athena:UpdatePreparedStatement',
        'athena:DeletePreparedStatement',
      ],
      resources: [
        `arn:aws:athena:${currentStack.region}:${currentStack.account}:workgroup/${this.workGroupName}`,
      ],
    }));
  }
}
