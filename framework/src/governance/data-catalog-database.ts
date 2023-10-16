// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Names, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnCrawler, CfnDatabase, CfnSecurityConfiguration } from 'aws-cdk-lib/aws-glue';
import { AddToPrincipalPolicyResult, Effect, IPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Context, TrackedConstruct, TrackedConstructProps } from '../utils';

/**
 * An AWS Glue Data Catalog Database configured with the location and a crawler.
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/data-catalog-database
 *
 * @example
 * import { Bucket } from 'aws-cdk-lib/aws-s3';
 *
 * new dsf.DataCatalogDatabase(this, 'ExampleDatabase', {
 *    locationBucket: new Bucket(scope, 'LocationBucket'),
 *    locationPrefix: '/databasePath',
 *    name: 'example-db'
 * });
 */
export class DataCatalogDatabase extends TrackedConstruct {
  /**
   * The Glue Crawler that is automatically created when `autoCrawl` is set to `true` (default value). This property can be undefined if `autoCrawl` is set to `false`.
   */
  readonly crawler?: CfnCrawler;

  /**
   * The Glue database that's created
   */
  readonly database: CfnDatabase;

  /**
   * The Glue database name with the randomized suffix to prevent name collisions in the catalog
   */
  readonly databaseName: string;

  /**
   * KMS encryption key used by the Crawler
   */
  readonly crawlerLogEncryptionKey?: Key;

  /**
   * Caching constructor properties for internal reuse by constructor methods
   */
  private dataCatalogDatabaseProps: DataCatalogDatabaseProps;

  constructor(scope: Construct, id: string, props: DataCatalogDatabaseProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataCatalogDatabase.name,
    };

    super(scope, id, trackedConstructProps);
    this.dataCatalogDatabaseProps = props;
    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.databaseName = props.name + '_' + Names.uniqueResourceName(scope, {}).toLowerCase();

    let locationPrefix = props.locationPrefix;

    if (!locationPrefix.endsWith('/')) {
      locationPrefix += '/';
    }

    const s3LocationUri = props.locationBucket.s3UrlForObject(locationPrefix);
    this.database = new CfnDatabase(this, 'GlueDatabase', {
      catalogId: Stack.of(this).account,
      databaseInput: {
        name: this.databaseName,
        locationUri: s3LocationUri,
      },
    });

    let autoCrawl = props.autoCrawl;

    if (autoCrawl === undefined || autoCrawl === null) {
      autoCrawl = true;
    }

    const autoCrawlSchedule = props.autoCrawlSchedule || {
      scheduleExpression: 'cron(1 0 * * ? *)',
    };

    const currentStack = Stack.of(this);

    if (autoCrawl) {
      const tableLevel = props.crawlerTableLevelDepth || 3;
      const crawlerRole = new Role(this, 'CrawlerRole', {
        assumedBy: new ServicePrincipal('glue.amazonaws.com'),
        inlinePolicies: {
          crawlerPermissions: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'glue:BatchCreatePartition',
                  'glue:BatchDeletePartition',
                  'glue:BatchDeleteTable',
                  'glue:BatchDeleteTableVersion',
                  'glue:BatchGetPartition',
                  'glue:BatchUpdatePartition',
                  'glue:CreatePartition',
                  'glue:CreateTable',
                  'glue:DeletePartition',
                  'glue:DeleteTable',
                  'glue:GetDatabase',
                  'glue:GetDatabases',
                  'glue:GetPartition',
                  'glue:GetPartitions',
                  'glue:GetTable',
                  'glue:GetTables',
                  'glue:UpdateDatabase',
                  'glue:UpdatePartition',
                  'glue:UpdateTable',
                ],
                resources: [
                  `arn:aws:glue:${currentStack.region}:${currentStack.account}:catalog`,
                  `arn:aws:glue:${currentStack.region}:${currentStack.account}:database/${this.databaseName}`,
                  `arn:aws:glue:${currentStack.region}:${currentStack.account}:table/${this.databaseName}/*`,
                ],
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'glue:GetSecurityConfigurations',
                  'glue:GetSecurityConfiguration',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      props.locationBucket.grantRead(crawlerRole, locationPrefix+'*');

      this.crawlerLogEncryptionKey = props.crawlerLogEncryptionKey || new Key(this, 'CrawlerLogKey', {
        enableKeyRotation: true,
        removalPolicy: removalPolicy,
      });

      this.crawlerLogEncryptionKey.grantEncryptDecrypt(crawlerRole);

      const secConfiguration = new CfnSecurityConfiguration(this, 'CrawlerSecConfiguration', {
        name: `${props.name}-secconfig-${Names.uniqueResourceName(this, {}).toLowerCase()}`,
        encryptionConfiguration: {
          cloudWatchEncryption: {
            cloudWatchEncryptionMode: 'SSE-KMS',
            kmsKeyArn: this.crawlerLogEncryptionKey.keyArn,
          },
          s3Encryptions: [
            {
              s3EncryptionMode: 'DISABLED',
            },
          ],
        },
      });

      const crawlerName = `${this.databaseName}-crawler-${Names.uniqueResourceName(this, {})}`;
      this.crawler = new CfnCrawler(this, 'DatabaseAutoCrawler', {
        role: crawlerRole.roleArn,
        targets: {
          s3Targets: [{
            path: s3LocationUri,
          }],
        },
        schedule: autoCrawlSchedule,
        databaseName: this.databaseName,
        name: crawlerName,
        crawlerSecurityConfiguration: secConfiguration.name,
        configuration: JSON.stringify({
          Version: 1.0,
          Grouping: {
            TableLevelConfiguration: tableLevel,
          },
        }),
      });

      const logGroup = `arn:aws:logs:${currentStack.region}:${currentStack.account}:log-group:/aws-glue/crawlers*`;
      crawlerRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:AssociateKmsKey',
        ],
        resources: [
          logGroup,
          `${logGroup}:*`,
        ],
      }));

      this.crawlerLogEncryptionKey.addToResourcePolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
        ],
        resources: ['*'],
        principals: [
          new ServicePrincipal(`logs.${currentStack.region}.amazonaws.com`),
        ],
        conditions: {
          ArnEquals: {
            'kms:EncryptionContext:aws:logs:arn': logGroup,
          },
        },
      }));
    }
  }

  /**
   * Grants read access via identity based policy to the principal. This would attach an IAM policy to the principal allowing read access to the database and all its tables.
   * @param principal Principal to attach the database read access to
   * @returns `AddToPrincipalPolicyResult`
   */
  public grantReadOnlyAccess(principal: IPrincipal): AddToPrincipalPolicyResult {
    const currentStack = Stack.of(this);

    let locationPrefix = this.dataCatalogDatabaseProps.locationPrefix;

    if (!locationPrefix.endsWith('/')) {
      locationPrefix += '/';
    }

    this.dataCatalogDatabaseProps.locationBucket.grantRead(principal, locationPrefix+'*');
    return principal.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'glue:GetTable',
        'glue:GetTables',
        'glue:BatchGetPartition',
        'glue:GetDatabase',
        'glue:GetDatabases',
        'glue:GetPartition',
        'glue:GetPartitions',
      ],
      resources: [
        `arn:aws:glue:${currentStack.region}:${currentStack.account}:catalog`,
        `arn:aws:glue:${currentStack.region}:${currentStack.account}:database/${this.databaseName}`,
        `arn:aws:glue:${currentStack.region}:${currentStack.account}:table/${this.databaseName}/*`,
      ],
    }));
  }
}

/**
 * The Database catalog properties
 */
export interface DataCatalogDatabaseProps {
  /**
   * Database name. Construct would add a randomize suffix as part of the name to prevent name collisions.
   */
  readonly name: string;

  /**
   * S3 bucket where data is stored
   */
  readonly locationBucket: IBucket;

  /**
   * Top level location wwhere table data is stored.
   */
  readonly locationPrefix: string;

  /**
   * When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter.
   * @default True
   */
  readonly autoCrawl?: boolean;

  /**
   * The schedule when the Crawler would run. Default is once a day at 00:01h.
   * @default `cron(1 0 * * ? *)`
   */
  readonly autoCrawlSchedule?: CfnCrawler.ScheduleProperty;

  /**
   * Encryption key used for Crawler logs
   * @default Create a new key if none is provided
   */
  readonly crawlerLogEncryptionKey?: Key;

  /**
   * Directory depth where the table folders are located. This helps the crawler understand the layout of the folders in S3.
   * @default 3. The default value follows the structure: `<bucket>/<databaseFolder>/<table1Folder>/`
   */
  readonly crawlerTableLevelDepth?: number;

  /**
   * Policy to apply when the bucket is removed from this stack.
   * * @default - RETAIN (The bucket will be orphaned).
   */
  readonly removalPolicy?: RemovalPolicy;
}