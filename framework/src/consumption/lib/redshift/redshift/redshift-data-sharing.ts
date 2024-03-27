// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CustomResource, Duration, Stack } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { BaseRedshiftDataAccess, RedshiftDataAccessTargetProps } from './base-redshift-data-access';
import { RedshiftData } from './redshift-data';
import { RedshiftDataSharingCreateDbProps } from './redshift-data-sharing-createdb-props';
import { RedshiftDataSharingGrantProps } from './redshift-data-sharing-grant-props';
import { RedshiftDataSharingProps } from './redshift-data-sharing-props';
import { TrackedConstructProps } from '../../../../utils';
import { DsfProvider } from '../../../../utils/lib/dsf-provider';

/**
 * Creates an asynchronous custom resource to manage the data sharing lifecycle for
 * both data producers and data consumers. This also covers both same account and cross account access.
 *
 * @example
 * const namespace = new dsf.consumption.RedshiftServerlessNamespace(this, 'RedshiftNamespace', {
 *    name: "default",
 *    dbName: 'defaultdb',
 * });
 *
 * const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "RedshiftWorkgroup", {
 *    name: "redshift-workgroup",
 *    namespace: namespace,
 * });
 *
 * const dataSharing = workgroup.dataSharing('producer-data-sharing', true)
 * const newShare = sharing.createShare("tpcds-share", "sample_data_dev", "sharetpcds", "tpcds", ["tpcds.customer", "tpcds.item", "tpcds.inventory"])
 * const grant = sharing.grant("GrantDataShare", {
 *   databaseName: "test",
 *   dataShareName: "sharetpcds",
 *   dataShareArn: newShare.getAttString("dataShareArn"),
 *   accountId: "123456789012",
 *   autoAuthorized: true
 * })
 *
 * grant.node.addDependency(newShare)
 */
export class RedshiftDataSharing extends BaseRedshiftDataAccess {
  /**
   * The IAM Role for the Redshift Data API execution
   */
  public readonly executionRole: IRole;

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
        depsLockFilePath: __dirname+'/../resources/RedshiftDataShare/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataShare/index.mjs',
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
        depsLockFilePath: __dirname+'/../resources/RedshiftDataShare/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataShare/index.mjs',
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
    this.redshiftData = props.redshiftData;
  }

  /**
   * Create a new datashare
   * @param databaseName The name of the database to connect to
   * @param dataShareName The name of the datashare
   * @param schema The schema to add in the datashare
   * @param tables The list of tables that would be included in the datashare. This must follow the format: `<schema>.<tableName>`
   * @returns `CustomResource`
   */
  public createShare(id: string, databaseName: string, dataShareName: string, schema: string, tables: string[]): CustomResource {
    return new CustomResource(this, id, {
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
  }

  /**
   * Create a datashare grant to a namespace if it's in the same account, or to another account
   * @param props `RedshiftDataSharingGrantProps`
   * @returns `CustomResource`
   */
  public grant(id: string, props: RedshiftDataSharingGrantProps): CustomResource {
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

    //Only needed for cross-account grants
    if (autoAuthorized && accountId && accountId != Stack.of(this).account) {
      if (!dataShareArn) {
        throw new Error('For cross account grants, `dataShareArn` is required');
      }
      // eslint-disable-next-line local-rules/no-tokens-in-construct-id
      const shareAuthorization = new AwsCustomResource(this, `${id}-authorization`, {
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

    return grant;
  }

  /**
   * Consume datashare by creating a new database pointing to the share.
   * If datashare is coming from a different account, setting `autoAssociate` to true
   * automatically associates the datashare to the cluster before the new database is created.
   * @param props `RedshiftDataSharingCreateDbProps`
   * @returns `CustomResource`
   */
  public createDatabaseFromShare(id: string, props: RedshiftDataSharingCreateDbProps): CustomResource {
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

    if (isCrossAccount) {
      if (!dataShareArn || !consumerNamespaceArn) {
        throw new Error('For cross-account datashares, `dataShareArn` and `consumerNamespaceArn` is required');
      }

      // eslint-disable-next-line local-rules/no-tokens-in-construct-id
      const associateDataShare = new AwsCustomResource(this, `${id}-associateDataShare`, {
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

    return createDbFromShare;
  }
}