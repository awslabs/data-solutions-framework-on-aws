// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Names, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnCrawler, CfnDatabase, CfnSecurityConfiguration } from 'aws-cdk-lib/aws-glue';
import { AddToPrincipalPolicyResult, Effect, IPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { TrackedConstruct, TrackedConstructProps } from '../utils';

/**
* An AWS Glue Data Catalog Database configured with the following:
*   * Default location using the following defaults: `s3://<locationBucket>/<locationPrefix>/`
*   * Inside the location would be the various tables structured in their respective prefixes, for example: `s3://<locationBucket>/<locationPrefix>/<table_prefix>/`
*   * The default would create a database level crawler that's scheduled to run once a day (00:01h). This can be overriden to either disable the crawler or control the schedule/frequency of the crawler execution.
*
*
* **Usage example**
*
* ```typescript
* import * as cdk from 'aws-cdk-lib';
* import { DataCatalogDatabase } from 'aws-data-solutions-framework';
*
* const exampleApp = new cdk.App();
* const stack = new cdk.Stack(exampleApp, 'DataCatalogStack');
*
* new DataCatalogDatabase(stack, 'ExampleDatabase', {
*    locationBucket: bucket,
*    locationPrefix: '/databasePath',
*    name: 'example-db'
* });
* ```
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
   * Encryption key used for Crawler logs. Would only be created when `autoCrawl` is enabled.
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

    this.databaseName = props.name + '-' + Names.uniqueResourceName(scope, {}).toLowerCase();

    this.database = new CfnDatabase(this, 'GlueDatabase', {
      catalogId: Stack.of(this).account,
      databaseInput: {
        name: this.databaseName,
        locationUri: props.locationBucket.s3UrlForObject(props.locationPrefix),
      },
    });

    let autoCrawl = props.autoCrawl;

    if (autoCrawl === undefined || autoCrawl === null) {
      autoCrawl = true;
    }

    const autoCrawlSchedule = props.autoCrawlSchedule || {
      scheduleExpression: 'cron(1 0 * * * *)',
    };

    const currentStack = Stack.of(this);

    if (autoCrawl) {
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
            ],
          }),
        },
      });

      props.locationBucket.grantRead(crawlerRole, props.locationPrefix+'/*');

      this.crawlerLogEncryptionKey = props.crawlerLogEncryptionKey || new Key(this, 'CrawlerLogKey', {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.RETAIN,
      });

      this.crawlerLogEncryptionKey.grantEncryptDecrypt(crawlerRole);

      const secConfiguration = new CfnSecurityConfiguration(this, 'CrawlerSecConfiguration', {
        name: `${this.databaseName}-crawler-secconfig`,
        encryptionConfiguration: {
          cloudWatchEncryption: {
            cloudWatchEncryptionMode: 'SSE-KMS',
            kmsKeyArn: this.crawlerLogEncryptionKey.keyArn,
          },
        },
      });

      this.crawler = new CfnCrawler(this, 'DatabaseAutoCrawler', {
        role: crawlerRole.roleArn,
        targets: {
          catalogTargets: [
            {
              databaseName: this.databaseName,
            },
          ],
        },
        schedule: autoCrawlSchedule,
        databaseName: this.databaseName,
        crawlerSecurityConfiguration: secConfiguration.name,
      });
    }
  }

  /**
   * Grants read access via identity based policy to the principal. This would attach an IAM policy to the principal allowing read access to the database and all its tables.
   * @param principal Principal to attach the database read access to
   * @returns `AddToPrincipalPolicyResult`
   */
  public grantReadOnlyAccess(principal: IPrincipal): AddToPrincipalPolicyResult {
    const currentStack = Stack.of(this);
    this.dataCatalogDatabaseProps.locationBucket.grantRead(principal, this.dataCatalogDatabaseProps.locationPrefix+'/*');
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
   * @default `cron(1 0 * * * *)`
   */
  readonly autoCrawlSchedule?: CfnCrawler.ScheduleProperty;

  /**
   * Encryption key used for Crawler logs
   * @default Create a new key if none is provided
   */
  readonly crawlerLogEncryptionKey?: Key;
}