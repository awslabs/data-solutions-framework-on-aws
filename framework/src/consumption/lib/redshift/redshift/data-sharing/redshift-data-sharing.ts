// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CustomResource, Duration, Stack } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { RedshiftDataSharingCreateDbProps } from './redshift-data-sharing-createdb-props';
import { RedshiftDataSharingCreateDbFromShareProps } from './redshift-data-sharing-createdbfromshare-props';
import { RedshiftDataSharingGrantProps } from './redshift-data-sharing-grant-props';
import { RedshiftDataSharingGrantedProps } from './redshift-data-sharing-granted-props';
import { RedshiftDataSharingProps } from './redshift-data-sharing-props';
import { RedshiftNewShareProps } from './redshift-new-share-props';
import { TrackedConstructProps } from '../../../../../utils';
import { DsfProvider } from '../../../../../utils/lib/dsf-provider';
import { BaseRedshiftDataAccess, RedshiftDataAccessTargetProps } from '../base-redshift-data-access';
import { RedshiftData } from '../redshift-data';

/**
 * Creates an asynchronous custom resource to manage the data sharing lifecycle for
 * both data producers and data consumers. This also covers both same account and cross account access.
 *
 * @exampleMetadata fixture=vpc-secret
 * @example
 * const redshiftAdminSecret = Secret.fromSecretPartialArn(this, 'RedshiftAdminCredentials', 'arn:aws:secretsmanager:us-east-1:XXXXXXXX:secret:YYYYYYYY');
 *
 * const redshiftVpc = Vpc.fromLookup(this, 'RedshiftVpc', {
 *   vpcId: 'XXXXXXXX',
 * });
 *
 * const dataAccess = new dsf.consumption.RedshiftData(this, 'RedshiftDataAccess', {
 *   workgroupId: 'XXXXXXXXXXXXXXX',
 *   secret: redshiftAdminSecret,
 *   vpc: redshiftVpc,
 *   subnets: redshiftVpc.selectSubnets({
 *     subnetGroupName: 'YYYYYYYY'
 *   }),
 *   createInterfaceVpcEndpoint: true,
 *   executionTimeout: Duration.minutes(10),
 * });
 *
 * const dataShare = new dsf.consumption.RedshiftDataSharing(this, 'RedshiftDataShare', {
 *   redshiftData: dataAccess,
 *   workgroupId: 'XXXXXXXXXXXXXXX',
 *   secret: redshiftAdminSecret,
 *   vpc: redshiftVpc,
 *   subnets: redshiftVpc.selectSubnets({
 *     subnetGroupName: 'YYYYYYYY'
 *   }),
 *   createInterfaceVpcEndpoint: true,
 *   executionTimeout: Duration.minutes(10),
 * });
 *
 *  const share = dataShare.createShare('ProducerShare', 'default', 'example_share', 'public', ['public.customers']);
 *
 *  const grantToConsumer = dataShare.grant('GrantToConsumer', {
 *    dataShareName: 'example_share',
 *    databaseName: 'default',
 *    autoAuthorized: true,
 *    accountId: "<CONSUMER_ACCOUNT_ID>",
 *    dataShareArn: '<DATASHARE_ARN>',
 *  });
 *
 * dataShare.createDatabaseFromShare('ProducerShare', {
 *   consumerNamespaceArn: '',
 *   newDatabaseName: 'db_from_share',
 *   databaseName: 'default',
 *   dataShareName: 'example_share',
 *   dataShareArn: '<DATASHARE_ARN>',
 *   accountId: "<PRODUCER_ACCOUNT_ID>",
 * });
 */
export class RedshiftDataSharing extends BaseRedshiftDataAccess {
  /**
   * The IAM Role for the Redshift Data API execution
   */
  public readonly executionRole: IRole;

  /**
   * The CloudWatch Log Group for the Redshift Data Sharing submission
   */
  public readonly submitLogGroup: ILogGroup;
  /**
   * The Lambda Function for the Redshift Data Sharing submission
   */
  public readonly submitFunction: IFunction;

  /**
   * The CloudWatch Log Group for the Redshift Data Sharing status checks
   */
  public readonly statusLogGroup: ILogGroup;
  /**
   * The Lambda Function for the Redshift Data Sharing status checks
   */
  public readonly statusFunction: IFunction;

  /**
   * The CloudWatch Log Group for the Redshift Data Sharing cleaning up lambda
   */
  public readonly cleanUpLogGroup?: ILogGroup;
  /**
   * The Lambda function for the cleaning up lambda
   */
  public readonly cleanUpFunction?: IFunction;

  /**
   * The IAM Role for the the cleaning up lambda
   */
  public readonly cleanUpRole?: IRole;

  /**
   * Contains normalized details of the target Redshift cluster/workgroup for data access
   */
  public readonly dataAccessTargetProps: RedshiftDataAccessTargetProps;
  private readonly serviceToken: string;
  private readonly redshiftData: RedshiftData;

  constructor(scope: Construct, id: string, props: RedshiftDataSharingProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: RedshiftDataSharing.name,
    };

    super(scope, id, props, trackedConstructProps);

    this.dataAccessTargetProps = this.getDataAccessTarget(props);

    this.executionRole = this.createProviderExecutionRole('RedshiftDataExecRole', this.dataAccessTargetProps, props);

    const timeout = props.executionTimeout || Duration.minutes(5);

    const currentStack = Stack.of(this);

    const dataShareProvider = new DsfProvider(this, 'CrDataShareProvider', {
      providerName: 'RedshiftDataShareProvider',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/../../resources/RedshiftDataShare/package-lock.json',
        entryFile: __dirname+'/../../resources/RedshiftDataShare/index.mjs',
        handler: 'index.onEventHandler',
        environment: {
          TARGET_ARN: this.dataAccessTargetProps.targetArn,
          TARGET_TYPE: this.dataAccessTargetProps.targetType,
          SECRET_NAME: props.secret.secretArn,
          REGION: currentStack.region,
        },
        iamRole: this.executionRole,
        timeout,
      },
      isCompleteHandlerDefinition: {
        iamRole: this.executionRole,
        handler: 'index.isCompleteHandler',
        depsLockFilePath: __dirname+'/../../resources/RedshiftDataShare/package-lock.json',
        entryFile: __dirname+'/../../resources/RedshiftDataShare/index.mjs',
        timeout,
        environment: {
          TARGET_ARN: this.dataAccessTargetProps.targetArn,
          TARGET_TYPE: this.dataAccessTargetProps.targetType,
          TARGET_ID: this.dataAccessTargetProps.targetId,
          SECRET_NAME: props.secret.secretArn,
          REGION: currentStack.region,
        },
      },
      vpc: props.vpc,
      subnets: props.subnets,
      securityGroups: this.customResourceSecurityGroup ? [this.customResourceSecurityGroup] : [],
      queryInterval: Duration.seconds(1),
      removalPolicy: this.removalPolicy,
    });

    this.serviceToken = dataShareProvider.serviceToken;
    this.submitLogGroup = dataShareProvider.onEventHandlerLogGroup;
    this.statusLogGroup = dataShareProvider.isCompleteHandlerLog!;
    this.cleanUpLogGroup = dataShareProvider.cleanUpLogGroup;
    this.submitFunction = dataShareProvider.onEventHandlerFunction;
    this.statusFunction = dataShareProvider.isCompleteHandlerFunction!;
    this.cleanUpFunction = dataShareProvider.cleanUpFunction;
    this.cleanUpRole = dataShareProvider.cleanUpRole;

    this.redshiftData = props.redshiftData;
  }

  /**
   * Create a new datashare
   * @param id the CDK ID of the resource
   * @param databaseName The name of the database to connect to
   * @param dataShareName The name of the datashare
   * @param schema The schema to add in the datashare
   * @param tables The list of tables that would be included in the datashare. This must follow the format: `<schema>.<tableName>`
   * @returns `RedshiftNewShareProps`
   */
  public createShare(id: string, databaseName: string, dataShareName: string, schema: string, tables: string[]): RedshiftNewShareProps {
    const cr = new CustomResource(this, id, {
      resourceType: 'Custom::RedshiftDataShare',
      serviceToken: this.serviceToken,
      properties: {
        databaseName,
        dataShareName,
        schema,
        tables,
      },
      removalPolicy: this.removalPolicy,
    });

    return {
      databaseName,
      dataShareName,
      dataShareArn: cr.getAttString('dataShareArn'),
      producerNamespace: cr.getAttString('dataShareNamespace'),
      producerArn: cr.getAttString('producerArn'),
      newShareCustomResource: cr,
    };
  }

  /**
   * Create a datashare grant to a namespace if it's in the same account, or to another account
   * @param id the CDK ID of the resource
   * @param props `RedshiftDataSharingGrantProps`
   * @returns `RedshiftDataSharingGrantedProps`
   */
  public grant(id: string, props: RedshiftDataSharingGrantProps): RedshiftDataSharingGrantedProps {
    const { dataShareName, databaseName, autoAuthorized, accountId, namespaceId, dataShareArn } = props;
    let convertedSql = '';

    if (namespaceId) {
      convertedSql = `namespace '${namespaceId}'`;
    } else if (accountId) {
      convertedSql = `account '${accountId}'`;
    } else {
      throw new Error('Either account or namespaceId is required for grant');
    }

    let sql = `grant usage on datashare ${dataShareName} to ${convertedSql}`;
    let deleteSql = `revoke usage on datashare ${dataShareName} from ${convertedSql}`;

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    const grant = this.redshiftData.runCustomSQL(`${id}-${databaseName}-${dataShareName}`, databaseName, sql, deleteSql);
    let shareAuthorization;
    //Only needed for cross-account grants
    if (autoAuthorized && accountId && accountId != Stack.of(this).account) {
      if (!dataShareArn) {
        throw new Error('For cross account grants, `dataShareArn` is required');
      }
      // eslint-disable-next-line local-rules/no-tokens-in-construct-id
      shareAuthorization = new AwsCustomResource(this, `${id}Authorization`, {
        onCreate: {
          service: 'redshift',
          action: 'authorizeDataShare',
          parameters: {
            DataShareArn: dataShareArn,
            ConsumerIdentifier: accountId,
          },
          physicalResourceId: PhysicalResourceId.of(`AuthorizeDataShare-${accountId}-${dataShareArn}`),
        },
        onDelete: {
          service: 'redshift',
          action: 'deauthorizeDataShare',
          parameters: {
            DataShareArn: dataShareArn,
            ConsumerIdentifier: accountId,
          },
        },
        removalPolicy: this.removalPolicy,
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: [
            dataShareArn,
          ],
        }),
      });

      shareAuthorization.node.addDependency(grant);
    }

    return {
      resource: grant,
      shareAuthorizationResource: shareAuthorization,
    };
  }

  /**
   * Consume datashare by creating a new database pointing to the share.
   * If datashare is coming from a different account, setting `autoAssociate` to true
   * automatically associates the datashare to the cluster before the new database is created.
   * @param id the CDK ID of the resource
   * @param props `RedshiftDataSharingCreateDbProps`
   * @returns `CustomResource`
   */
  public createDatabaseFromShare(id: string, props: RedshiftDataSharingCreateDbProps): RedshiftDataSharingCreateDbFromShareProps {
    const currentStack = Stack.of(this);

    const { dataShareName, databaseName, newDatabaseName, consumerNamespaceArn, accountId, namespaceId, dataShareArn } = props;

    const isCrossAccount = (accountId && accountId != currentStack.account);

    let convertedSql = '';

    if (!isCrossAccount) {
      if (namespaceId) {
        convertedSql = `namespace '${namespaceId}'`;
      } else {
        throw new Error('Missing namespace id');
      }
    } else {
      if (accountId && namespaceId) {
        convertedSql = `account '${accountId}' namespace '${namespaceId}'`;
      } else {
        throw new Error('Cross account, requires both account id and namespace id');
      }
    }

    let sql = `create database ${newDatabaseName} from datashare ${dataShareName} of ${convertedSql}`;
    let deleteSql = `drop database ${newDatabaseName}`;

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    const createDbFromShare = this.redshiftData.runCustomSQL(`${id}-${databaseName}-${dataShareName}`, databaseName, sql, deleteSql);
    let associateDataShare;
    if (isCrossAccount) {
      if (!dataShareArn || !consumerNamespaceArn) {
        throw new Error('For cross-account datashares, `dataShareArn` and `consumerNamespaceArn` is required');
      }

      // eslint-disable-next-line local-rules/no-tokens-in-construct-id
      associateDataShare = new AwsCustomResource(this, `${id}AssociateDataShare`, {
        onCreate: {
          service: 'redshift',
          action: 'associateDataShareConsumer',
          parameters: {
            DataShareArn: dataShareArn,
            AssociateEntireAccount: false,
            ConsumerArn: consumerNamespaceArn,
          },
          physicalResourceId: PhysicalResourceId.of(`AssocDataShareConsumer-${accountId}-${namespaceId}`),
        },
        onDelete: {
          service: 'redshift',
          action: 'disassociateDataShareConsumer',
          parameters: {
            DataShareArn: dataShareArn,
            ConsumerArn: consumerNamespaceArn,
            DisassociateEntireAccount: false,
          },
        },
        removalPolicy: this.removalPolicy,
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: [
            dataShareArn,
          ],
        }),
      });

      createDbFromShare.node.addDependency(associateDataShare);
    }

    return {
      resource: createDbFromShare,
      associateDataShareResource: associateDataShare,
    };
  }
}