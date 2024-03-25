// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack } from 'aws-cdk-lib';
import { CfnCrawler, CfnDatabase, CfnSecurityConfiguration } from 'aws-cdk-lib/aws-glue';
import { AddToPrincipalPolicyResult, Effect, IPrincipal, IRole, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { CfnDataLakeSettings, CfnResource } from 'aws-cdk-lib/aws-lakeformation';
import { Construct } from 'constructs';
import { DataCatalogDatabaseProps } from './data-catalog-database-props';
import { makeCdkLfAdmin } from './lake-formation-helpers';
import { Context, PermissionModel, TrackedConstruct, TrackedConstructProps, Utils } from '../../utils';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

/**
 * An AWS Glue Data Catalog Database configured with the location and a crawler.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Governance/data-catalog-database
 *
 * @example
 * import { Bucket } from 'aws-cdk-lib/aws-s3';
 *
 * new dsf.governance.DataCatalogDatabase(this, 'ExampleDatabase', {
 *    locationBucket: new Bucket(scope, 'LocationBucket'),
 *    locationPrefix: '/databasePath',
 *    name: 'example-db'
 * });
 */
export class DataCatalogDatabase extends TrackedConstruct {
  /**
   * The Glue Crawler created when `autoCrawl` is set to `true` (default value). This property can be undefined if `autoCrawl` is set to `false`.
   */
  readonly crawler?: CfnCrawler;
  /**
   * The Glue security configuration used by the Glue Crawler when created.
   */
  readonly crawlerSecurityConfiguration?: CfnSecurityConfiguration;
  /**
   * The IAM Role used by the Glue crawler when created.
   */
  readonly crawlerRole?: IRole;
  /**
   * The Glue Database that's created
   */
  readonly database: CfnDatabase;
  /**
   * The Glue Database name with the randomized suffix to prevent name collisions in the catalog
   */
  readonly databaseName: string;
  /**
   * KMS encryption Key used by the Crawler
   */
  readonly crawlerLogEncryptionKey?: IKey;
  /**
   * The DataLakeSettings for Lake Formation
   */
  readonly dataLakeSettings?: CfnDataLakeSettings;
  /**
   * The IAM Role used by Lake Formation to access data.
   */
  readonly lfDataAccessRole?: IRole;
  /**
   * The Lake Formation data lake location
   */
  readonly dataLakeLocation?: CfnResource;
  /**
   * The custom resource for revoking IAM permissions from the database
   */
  readonly removeIamAllowedPrincipal?: AwsCustomResource;
  /**
   * Caching constructor properties for internal reuse by constructor methods
   */
  private dataCatalogDatabaseProps: DataCatalogDatabaseProps;

  constructor(scope: Construct, id: string, props: DataCatalogDatabaseProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataCatalogDatabase.name,
    };

    super(scope, id, trackedConstructProps);
    const catalogType = this.determineCatalogType(props);

    if (catalogType === CatalogType.INVALID) {
      throw new Error("Data catalog type can't be determined. Please check `DataCatalogDatabase` properties.");
    }

    this.dataCatalogDatabaseProps = props;
    const removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const hash = Utils.generateUniqueHash(this);
    this.databaseName = props.name + '_' + hash.toLowerCase();

    let s3LocationUri: string|undefined, locationPrefix: string|undefined;

    if (catalogType === CatalogType.S3) {
      locationPrefix = props.locationPrefix;

      if (!locationPrefix!.endsWith('/')) {
        locationPrefix += '/';
      }

      s3LocationUri = props.locationBucket!.s3UrlForObject(locationPrefix);

      if (props.permissionModel === PermissionModel.LAKE_FORMATION) {
        this.dataLakeSettings = makeCdkLfAdmin(this, 'CdkAdmin');

        // register location
        if (props.locationBucket) {
          // create the IAM role for LF data access
          this.lfDataAccessRole = new Role(this, 'LfDataAccessRole', {
            assumedBy: new ServicePrincipal('lakeformation.amazonaws.com'),
          });

          props.locationBucket.grantReadWrite(this.lfDataAccessRole, locationPrefix);
          props.locationBucket.encryptionKey?.grantEncryptDecrypt(this.lfDataAccessRole);

          this.dataLakeLocation = new CfnResource(this, 'DataLakeLocation', {
            useServiceLinkedRole: false,
            roleArn: this.lfDataAccessRole.roleArn,
            resourceArn: props.locationBucket?.arnForObjects(props.locationPrefix || ''),
          });
          // remove IAMAllowedPrincipal
          this.removeIamAllowedPrincipal = new AwsCustomResource(this, 'AssociateVPCWithHostedZone', {
            onCreate: {
              assumedRoleArn: 'arn:aws:iam::OTHERACCOUNT:role/CrossAccount/ManageHostedZoneConnections',
              service: 'LakeFormation',
              action: 'AssociateVPCWithHostedZone',
              parameters: {
                HostedZoneId: 'hz-123',
                VPC: {
                  VPCId: 'vpc-123',
                  VPCRegion: 'region-for-vpc',
                },
              },
              physicalResourceId: PhysicalResourceId.of('${vpcStack.SharedVpc.VpcId}-${vpcStack.Region}-${PrivateHostedZone.HostedZoneId}'),
            },
            //Will ignore any resource and use the assumedRoleArn as resource and 'sts:AssumeRole' for service:action
            policy: AwsCustomResourcePolicy.fromSdkCalls({
              resources: AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
          });
        }
      }
    }

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
      this.crawlerRole = props.crawlerRole || new Role(this, 'CrawlerRole', {
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


      this.crawlerLogEncryptionKey = props.crawlerLogEncryptionKey || new Key(this, 'CrawlerLogKey', {
        enableKeyRotation: true,
        removalPolicy: removalPolicy,
      });

      this.crawlerLogEncryptionKey.grantEncryptDecrypt(this.crawlerRole);

      this.crawlerSecurityConfiguration = new CfnSecurityConfiguration(this, 'CrawlerSecConfiguration', {
        name: `${props.name}-${hash.toLowerCase()}-secconfig`,
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

      const logGroup = `arn:aws:logs:${currentStack.region}:${currentStack.account}:log-group:/aws-glue/crawlers*`;

      this.crawlerRole.addToPrincipalPolicy(new PolicyStatement({
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

      const crawlerName = `${props.name}-${hash.toLowerCase()}-crawler`;

      if (catalogType === CatalogType.S3) {
        this.crawler = this.handleS3TypeCrawler(props, {
          autoCrawlSchedule,
          crawlerName,
          crawlerSecurityConfigurationName: this.crawlerSecurityConfiguration.name,
          locationPrefix: locationPrefix!,
          s3LocationUri: s3LocationUri!,
        });
      } else if (catalogType === CatalogType.JDBC) {
        this.crawler = this.handleJDBCTypeCrawler(props, {
          autoCrawlSchedule,
          crawlerName,
          crawlerSecurityConfigurationName: this.crawlerSecurityConfiguration.name,
        });
      }
    }
  }

  /**
   * Grants read access via identity based policy to the principal. This would attach an IAM Policy to the principal allowing read access to the Glue Database and all its Glue Tables.
   * @param principal Principal to attach the Glue Database read access to
   * @returns `AddToPrincipalPolicyResult`
   */
  public grantReadOnlyAccess(principal: IPrincipal): AddToPrincipalPolicyResult {
    const currentStack = Stack.of(this);

    const catalogType = this.determineCatalogType(this.dataCatalogDatabaseProps);

    if (catalogType === CatalogType.S3) {
      let locationPrefix = this.dataCatalogDatabaseProps.locationPrefix;

      if (!locationPrefix!.endsWith('/')) {
        locationPrefix += '/';
      }

      this.dataCatalogDatabaseProps.locationBucket!.grantRead(principal, locationPrefix+'*');
    }

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

  /**
   * Calculate the table depth level based on the location prefix. This is used by the crawler to determine where the table level files are located.
   * @param locationPrefix `string`
   * @returns `number`
   */
  private calculateDefaultTableLevelDepth(locationPrefix: string): number {
    const baseCount = 2;

    const locationTokens = locationPrefix.split('/');

    let ctrValidToken = 0;

    locationTokens.forEach((token) => {
      ctrValidToken += (token) ? 1 : 0;
    });

    return ctrValidToken + baseCount;
  }

  /**
   * Based on the parameters passed, it would determine type type of target the crawler would used.
   * @param props `DataCatalogDatabaseProps`
   * @returns `CatalogType`
   */
  private determineCatalogType(props: DataCatalogDatabaseProps): CatalogType {
    if (props.locationBucket && props.locationPrefix) {
      return CatalogType.S3;
    } else if (props.glueConnectionName && props.jdbcSecret && props.jdbcSecretKMSKey && props.jdbcPath) {
      return CatalogType.JDBC;
    }

    return CatalogType.INVALID;
  }

  /**
   * Handle the creation of the crawler with S3 target and its related permissions
   * @param props `DataCatalogDatabaseProps`
   * @param s3Props `S3CrawlerProps`
   * @returns `CfnCrawler`
   */
  private handleS3TypeCrawler(props: DataCatalogDatabaseProps, s3Props: S3CrawlerProps): CfnCrawler {
    const tableLevel = props.crawlerTableLevelDepth || this.calculateDefaultTableLevelDepth(s3Props.locationPrefix);
    const grantPrefix = s3Props.locationPrefix == '/' ? '' : s3Props.locationPrefix;
    props.locationBucket!.grantRead(this.crawlerRole!, grantPrefix+'*');

    return new CfnCrawler(this, 'DatabaseAutoCrawler', {
      role: this.crawlerRole!.roleArn,
      targets: {
        s3Targets: [{
          path: s3Props.s3LocationUri,
        }],
      },
      schedule: s3Props.autoCrawlSchedule,
      databaseName: this.databaseName,
      name: s3Props.crawlerName,
      crawlerSecurityConfiguration: s3Props.crawlerSecurityConfigurationName,
      configuration: JSON.stringify({
        Version: 1.0,
        Grouping: {
          TableLevelConfiguration: tableLevel,
        },
      }),
    });
  }

  /**
   * Handle the creation of the crawler with JDBC target and its related permissions
   * @param props `DataCatalogDatabaseProps`
   * @param jdbcProps `CrawlerProps`
   * @returns `CfnCrawler`
   */
  private handleJDBCTypeCrawler(props: DataCatalogDatabaseProps, jdbcProps: CrawlerProps): CfnCrawler {
    props.jdbcSecret!.grantRead(this.crawlerRole!);
    props.jdbcSecretKMSKey!.grantDecrypt(this.crawlerRole!);

    const currentStack = Stack.of(this);

    const policyConnection = this.crawlerRole!.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'glue:GetConnection',
        'glue:GetConnections',
      ],
      resources: [
        `arn:aws:glue:${currentStack.region}:${currentStack.account}:connection/${props.glueConnectionName}`,
        `arn:aws:glue:${currentStack.region}:${currentStack.account}:catalog`,
      ],
    }));

    const policyNetworking = this.crawlerRole!.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:DescribeVpcEndpoints',
        'ec2:DescribeRouteTables',
        'ec2:CreateNetworkInterface',
        'ec2:DeleteNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeSubnets',
        'ec2:DescribeVpcAttribute',
      ],
      resources: [
        '*',
      ],
    }));

    const policyIam = this.crawlerRole!.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'iam:PassRole',
      ],
      resources: [
        this.crawlerRole!.roleArn,
      ],
    }));

    const policyTags = this.crawlerRole!.addToPrincipalPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:CreateTags',
        'ec2:DeleteTags',
      ],
      resources: ['*'],
      conditions: {
        'ForAllValues:StringEquals': {
          'aws:TagKeys': [
            'aws-glue-service-resource',
          ],
        },
      },
    }));

    const crawler = new CfnCrawler(this, 'DatabaseAutoCrawler', {
      role: this.crawlerRole!.roleArn,
      targets: {
        jdbcTargets: [
          {
            connectionName: props.glueConnectionName!,
            path: props.jdbcPath,
          },
        ],
      },
      schedule: jdbcProps.autoCrawlSchedule,
      databaseName: this.databaseName,
      name: jdbcProps.crawlerName,
      crawlerSecurityConfiguration: jdbcProps.crawlerSecurityConfigurationName,
    });

    crawler.node.addDependency(policyConnection.policyDependable!
      , policyNetworking.policyDependable!
      , policyIam.policyDependable!
      , policyTags.policyDependable!);

    return crawler;
  }
}

/**
 * Enum used by the method that determines the type of catalog target based on the paramters passed
 */
enum CatalogType {
  S3,
  JDBC,
  INVALID
}

/**
 * Internal base interface for the crawler parameters
 */
interface CrawlerProps {
  crawlerName: string;
  autoCrawlSchedule: CfnCrawler.ScheduleProperty;
  crawlerSecurityConfigurationName: string;
}

/**
 * Internal interface for the s3 target crawler parameters
 */
interface S3CrawlerProps extends CrawlerProps {
  locationPrefix: string;
  s3LocationUri: string;
}