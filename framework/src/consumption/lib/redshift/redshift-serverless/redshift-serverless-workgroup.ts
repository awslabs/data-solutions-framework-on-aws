// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IConnectable, IInterfaceVpcEndpoint, ISecurityGroup, IVpc, Port, SecurityGroup, SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { CfnConnection } from 'aws-cdk-lib/aws-glue';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { CfnWorkgroup } from 'aws-cdk-lib/aws-redshiftserverless';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RedshiftServerlessNamespace } from './redshift-serverless-namespace';
import { RedshiftServerlessWorkgroupConfigParamKey, RedshiftServerlessWorkgroupProps } from './redshift-serverless-workgroup-props';
import { DataCatalogDatabase } from '../../../../governance';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../../utils';
import { RedshiftDataSharing } from '../redshift/data-sharing/redshift-data-sharing';
import { RedshiftDataSharingCreateDbFromShareProps } from '../redshift/data-sharing/redshift-data-sharing-createdbfromshare-props';
import { RedshiftDataSharingGrantedProps } from '../redshift/data-sharing/redshift-data-sharing-granted-props';
import { RedshiftNewShareProps } from '../redshift/data-sharing/redshift-new-share-props';
import { RedshiftData } from '../redshift/redshift-data';


/**
 * Create a Redshift Serverless Workgroup. A default namespace would be created if none is provided.
 *
 * @example
 * const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "RedshiftWorkgroup", {
 *    name: "example-workgroup",
 *    namespace: new dsf.consumption.RedshiftServerlessNamespace(this, "RedshiftNamespace", {
 *      name: 'example-namespace',
 *      dbName: 'defaultdb',
 *    })
 * });
 */
export class RedshiftServerlessWorkgroup extends TrackedConstruct implements IConnectable {
  private static readonly DEFAULT_VPC_CIDR = '10.0.0.0/16';
  private static readonly DEFAULT_VPC_PRIVATE_SUBNET_NAME = 'Private';
  private static readonly DEFAULT_PORT = 5439;

  /**
   * The created Redshift Serverless Workgroup
   */
  readonly cfnResource: CfnWorkgroup;
  /**
   * Connections used by Workgroup security group. Used this to enable access from clients connecting to the workgroup
   */
  readonly connections: Connections;
  /**
   * The associated Redshift Serverless Namespace
   */
  readonly namespace: RedshiftServerlessNamespace;
  /**
   * The Glue Connection associated with the workgroup. This can be used by Glue ETL Jobs to read/write data from/to Redshift workgroup
   */
  readonly glueConnection: CfnConnection;
  /**
   * The primary EC2 Security Group associated with the Redshift Serverless Workgroup
   */
  readonly primarySecurityGroup: ISecurityGroup;
  /**
   * The VPC where the Redshift Serverless Workgroup is deployed
   */
  readonly vpc: IVpc;

  /**
   * The subnets where the Redshift Serverless Workgroup is deployed
   */
  readonly selectedSubnets: SelectedSubnets;

  /**
   * Index of existing shares
   */
  readonly existingShares: {[key: string]: RedshiftNewShareProps} = {};

  private readonly removalPolicy: RemovalPolicy;
  private redshiftData?: RedshiftData;
  private redshiftDataSharing?: RedshiftDataSharing;
  private port: number;


  constructor(scope: Construct, id: string, props: RedshiftServerlessWorkgroupProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: RedshiftServerlessWorkgroup.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
    this.namespace = props.namespace;

    if (props.vpc) {
      this.vpc = props.vpc;
      if (props.subnets) {
        this.selectedSubnets = props.vpc.selectSubnets(props.subnets);
      } else {
        this.selectedSubnets = props.vpc.selectSubnets();
      }
    } else {
      const networkDetails = this.initDefaultNetworking();
      this.vpc = networkDetails.vpc;
      this.selectedSubnets = networkDetails.selectedSubnets;
    }

    const initSecurityGroupDetails = this.initSecurityGroup(props.extraSecurityGroups);
    this.primarySecurityGroup = initSecurityGroupDetails.primarySecurityGroup;
    this.connections = initSecurityGroupDetails.primaryConnections;
    this.port = props.port || RedshiftServerlessWorkgroup.DEFAULT_PORT;

    const configParameters: CfnWorkgroup.ConfigParameterProperty[] = [
      {
        parameterKey: RedshiftServerlessWorkgroupConfigParamKey.REQUIRE_SSL,
        parameterValue: 'true',
      },
    ];

    if (props.configParameters) {
      for (var x of props.configParameters) {
        if (x.parameterKey != RedshiftServerlessWorkgroupConfigParamKey.REQUIRE_SSL
          && (Object.values(RedshiftServerlessWorkgroupConfigParamKey) as string[]).includes(x.parameterKey!)) {
          configParameters.push(x);
        }
      }
    }

    this.cfnResource = new CfnWorkgroup(this, 'Workgroup', {
      workgroupName: `${props.name}${Utils.generateUniqueHash(this, id)}`,
      baseCapacity: props.baseCapacity,
      enhancedVpcRouting: true,
      namespaceName: props.namespace.namespaceName,
      port: this.port,
      publiclyAccessible: false,
      subnetIds: this.selectedSubnets.subnetIds,
      securityGroupIds: initSecurityGroupDetails.securityGroupIds,
      configParameters,
    });

    this.cfnResource.applyRemovalPolicy(this.removalPolicy);
    this.cfnResource.node.addDependency(this.namespace.customResource);
    this.glueConnection = this.createConnection();
  }

  /**
   * Creates a new Glue data catalog database with a crawler using JDBC target type to connect to the Redshift Workgroup
   * @param id The CDK ID of the resource
   * @param catalogDbName The name of the Glue Database to create
   * @param pathToCrawl The path of Redshift tables to crawl @default `<databaseName>/public/%``
   * @returns The DataCatalogDatabase created
   */
  public catalogTables(id: string, catalogDbName: string, pathToCrawl?: string): DataCatalogDatabase {
    if (!pathToCrawl) {
      pathToCrawl = `${this.namespace.dbName}/public/%`;
    }

    const catalog = new DataCatalogDatabase(this, id, {
      name: catalogDbName,
      glueConnectionName: `glue-conn-${this.cfnResource.workgroupName}`,
      jdbcSecret: this.namespace.adminSecret,
      jdbcSecretKMSKey: this.namespace.adminSecretKey,
      jdbcPath: pathToCrawl,
      removalPolicy: this.removalPolicy,
    });

    catalog.node.addDependency(this.glueConnection);

    return catalog;
  }

  /**
   * Create a new datashare
   * @param id The CDK ID of the resource
   * @param databaseName The name of the database to connect to
   * @param dataShareName The name of the datashare
   * @param schema The schema to add in the datashare
   * @param tables The list of tables that would be included in the datashare. This must follow the format: `<schema>.<tableName>`
   * @returns `RedshiftNewShareProps`
   */
  public createShare(id: string, databaseName: string, dataShareName: string, schema: string, tables: string[]): RedshiftNewShareProps {
    const sharing = this.dataSharing('DataSharing', true);
    const newShare = sharing.createShare(id, databaseName, dataShareName, schema, tables);
    this.existingShares[dataShareName] = newShare;

    return newShare;
  }

  /**
   * Create a datashare grant to a namespace if it's in the same account, or to another account
   * @param id The CDK ID of the resource
   * @param dataShareDetails The details of the datashare
   * @param consumerNamespaceId The namespace of the consumer that you're sharing to. Either namespace or account Id must be provided.
   * @param consumerAccountId The account ID of the consumer that you're sharing to. Either namespace or account Id must be provided.
   * @param autoAuthorized @default false, when this is set to true, cross-account shares would automatically be authorized
   * @returns `RedshiftDataSharingGrantedProps`
   */
  public grantAccessToShare(id: string, dataShareDetails: RedshiftNewShareProps, consumerNamespaceId?: string
    , consumerAccountId?: string, autoAuthorized?: boolean): RedshiftDataSharingGrantedProps {
    const sharing = this.dataSharing('DataSharing', true);
    return sharing.grant(id, {
      databaseName: dataShareDetails.databaseName,
      dataShareName: dataShareDetails.dataShareName,
      dataShareArn: dataShareDetails.dataShareArn,
      autoAuthorized,
      namespaceId: consumerNamespaceId,
      accountId: consumerAccountId,
    });
  }

  /**
   * Consume datashare by creating a new database pointing to the share.
   * If datashare is coming from a different account, setting `autoAssociate` to true
   * automatically associates the datashare to the cluster before the new database is created.
   * @param id The CDK ID of the resource
   * @param newDatabaseName The name of the database that would be created from the data share
   * @param producerDataShareName The name of the data share from producer
   * @param producerNamespaceId The producer cluster namespace
   * @param producerAccountId The producer account ID. Required for cross account shares.
   * @returns `CustomResource`
   */
  public createDatabaseFromShare(id: string, newDatabaseName: string, producerDataShareName: string
    , producerNamespaceId?: string, producerAccountId?: string): RedshiftDataSharingCreateDbFromShareProps {
    const currentStack = Stack.of(this);
    const sharing = this.dataSharing('DataSharing', true);
    const producerDataShareArn = `arn:aws:redshift:${currentStack.region}:${producerAccountId}:datashare:${producerNamespaceId}/${producerDataShareName}`;
    return sharing.createDatabaseFromShare(id, {
      databaseName: this.namespace.dbName,
      dataShareName: producerDataShareName,
      accountId: producerAccountId,
      consumerNamespaceArn: this.namespace.namespaceArn,
      namespaceId: producerNamespaceId,
      newDatabaseName,
      dataShareArn: producerDataShareArn,
    });
  }

  /**
   * Create Glue Connection and modifies the Redshift Serverless Workgroup's security group to allow Glue access via self-referencing rule.
   * @param props The properties of the Redshift Serverless Workgroup
   * @returns The Glue Connection to the Redshift Serverless Workgroup
   */
  private createConnection(): CfnConnection {
    const subnet = this.selectedSubnets.subnets[0];
    this.connections.allowFrom(this, Port.allTcp());

    const connection = new CfnConnection(this, 'GlueConnection', {
      catalogId: Stack.of(this).account,
      connectionInput: {
        name: `glue-conn-${this.cfnResource.workgroupName}`,
        connectionType: 'JDBC',
        connectionProperties: {
          JDBC_CONNECTION_URL: `jdbc:redshift://${this.cfnResource.attrWorkgroupEndpointAddress}:${this.port}/${this.namespace.dbName}`,
          SECRET_ID: this.namespace.adminSecret.secretArn,
        },
        physicalConnectionRequirements: {
          availabilityZone: subnet.availabilityZone,
          subnetId: subnet.subnetId,
          securityGroupIdList: [this.primarySecurityGroup.securityGroupId],
        },
      },
    });

    connection.applyRemovalPolicy(this.removalPolicy);
    connection.node.addDependency(this.namespace.adminSecret);
    connection.node.addDependency(this.cfnResource);

    return connection;
  }

  /**
   * Creates an instance of `RedshiftData` to send custom SQLs to the workgroup
   * @param id The CDK ID of the resource
   * @param createVpcEndpoint if set to true, create interface VPC endpoint for Redshift Data API
   * @param existingInterfaceVPCEndpoint if `createVpcEndpoint` is false, and if this is populated,
   * then the Lambda function's security group would be added in the existing VPC endpoint's security group.
   * @returns `RedshiftData`
   * @deprecated Use the convenience methods directly from the `RedshiftServerlessWorkgroup` construct.
   */
  public accessData(id: string, createVpcEndpoint?: boolean, existingInterfaceVPCEndpoint?: IInterfaceVpcEndpoint): RedshiftData {
    if (!this.redshiftData) {
      this.redshiftData = new RedshiftData(this, id, {
        secret: this.namespace.adminSecret,
        secretKey: this.namespace.adminSecretKey,
        workgroupId: this.cfnResource.attrWorkgroupWorkgroupId,
        vpc: this.vpc,
        subnets: this.selectedSubnets,
        createInterfaceVpcEndpoint: createVpcEndpoint,
        existingInterfaceVPCEndpoint,
        removalPolicy: this.removalPolicy,
      });

      this.redshiftData.node.addDependency(this.cfnResource);
    }

    return this.redshiftData;
  }

  /**
   * Runs a custom SQL. Once the custom resource finishes execution, the attribute `Data` contains an attribute `execId` which contains the Redshift Data API execution ID. You can then use this to retrieve execution results via the `GetStatementResult` API.
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param sql The sql to run
   * @param deleteSql Optional. The sql to run when this resource gets deleted
   * @returns `CustomResource`
   */
  public runCustomSQL(id: string, databaseName: string, sql: string, deleteSql?: string): CustomResource {
    return this.accessData(`${id}AccessData`, true).runCustomSQL(id, databaseName, sql, deleteSql);
  }

  /**
   * Creates a new DB role
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param roleName The name of the role to create
   * @returns `CustomResource`
   */
  public createDbRole(id: string, databaseName: string, roleName: string): CustomResource {
    return this.accessData(`${id}AccessData`, true).createDbRole(id, databaseName, roleName);
  }

  /**
   * Grants access to the schema to the DB role
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantDbSchemaToRole(id: string, databaseName: string, schema: string, roleName: string): CustomResource {
    return this.accessData(`${id}AccessData`).grantDbSchemaToRole(id, databaseName, schema, roleName);
  }

  /**
   * Grants read permission on all the tables in the `schema` to the DB role
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantSchemaReadToRole(id: string, databaseName: string, schema: string, roleName: string): CustomResource {
    return this.accessData(`${id}AccessData`).grantSchemaReadToRole(id, databaseName, schema, roleName);
  }

  /**
   * Grants both read and write permissions on all the tables in the `schema` to the DB role
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantDbAllPrivilegesToRole(id: string, databaseName: string, schema: string, roleName: string): CustomResource {
    return this.accessData(`${id}AccessData`).grantDbAllPrivilegesToRole(id, databaseName, schema, roleName);
  }

  /**
   * Assigns Redshift DB roles to IAM role vs the `RedshiftDbRoles` tag
   * @param dbRoles List of Redshift DB roles to assign to IAM role
   * @param targetRole The IAM role to assign the Redshift DB roles to
   */
  public assignDbRolesToIAMRole(dbRoles: string[], targetRole: IRole) {
    const idHash = Utils.generateHash(JSON.stringify(dbRoles) + ' ' + JSON.stringify(targetRole));
    this.accessData(`${idHash}AccessData`).assignDbRolesToIAMRole(dbRoles, targetRole);
  }

  /**
   * Ingest data from S3 into a Redshift table
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param targetTable The target table to load the data into
   * @param sourceBucket The bucket where the source data would be coming from
   * @param sourcePrefix The location inside the bucket where the data would be ingested from
   * @param ingestAdditionalOptions Optional. Additional options to pass to the `COPY` command. For example, `delimiter '|'` or `ignoreheader 1`
   * @param role Optional. The IAM Role to use to access the data in S3. If not provided, it would use the default IAM role configured in the Redshift Namespace
   * @returns
   */
  public ingestData(id: string, databaseName: string, targetTable: string, sourceBucket: IBucket, sourcePrefix: string,
    ingestAdditionalOptions?: string, role?: IRole): CustomResource {
    return this.accessData(`${id}AccessData`).ingestData(id, databaseName, targetTable, sourceBucket
      , sourcePrefix, ingestAdditionalOptions, role);
  }

  /**
   * Run the `MERGE` query using simplified mode. This command would do an upsert into the target table.
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param sourceTable The source table name. Schema can also be included using the following format: `schemaName.tableName`
   * @param targetTable The target table name. Schema can also be included using the following format: `schemaName.tableName`
   * @param sourceColumnId The column in the source table that's used to determine whether the rows in the `sourceTable` can be matched with rows in the `targetTable`. Default is `id`
   * @param targetColumnId The column in the target table that's used to determine whether the rows in the `sourceTable` can be matched with rows in the `targetTable`. Default is `id`
   * @returns `CustomResource`
   */
  public mergeToTargetTable(id: string, databaseName: string, sourceTable: string, targetTable: string, sourceColumnId?: string
    , targetColumnId?: string): CustomResource {
    return this.accessData(`${id}AccessData`).mergeToTargetTable(id, databaseName, sourceTable
      , targetTable, sourceColumnId, targetColumnId);
  }

  /**
   * Creates an instance of `RedshiftDataSharing` to manage the workgroup's data sharing.
   * @param id The CDK ID of the resource
   * @param createVpcEndpoint if set to true, create interface VPC endpoint for Redshift Data API
   * @param existingInterfaceVPCEndpoint if `createVpcEndpoint` is false, and if this is populated,
   * then the Lambda function's security group would be added in the existing VPC endpoint's security group.
   * @returns `RedshiftDataSharing`
   */
  private dataSharing(id: string, createVpcEndpoint?: boolean, existingInterfaceVPCEndpoint?: IInterfaceVpcEndpoint): RedshiftDataSharing {
    if (!this.redshiftDataSharing) {
      const dataAccess = this.accessData(`${id}DataAccess`, createVpcEndpoint, existingInterfaceVPCEndpoint);
      this.redshiftDataSharing = new RedshiftDataSharing(this, id, {
        secret: this.namespace.adminSecret,
        secretKey: this.namespace.adminSecretKey,
        workgroupId: this.cfnResource.attrWorkgroupWorkgroupId,
        vpc: this.vpc,
        subnets: this.selectedSubnets,
        createInterfaceVpcEndpoint: false,
        removalPolicy: this.removalPolicy,
        redshiftData: dataAccess,
        existingInterfaceVPCEndpoint: dataAccess.vpcEndpoint,
      });

      this.redshiftDataSharing.node.addDependency(this.cfnResource);
    }

    return this.redshiftDataSharing;
  }

  /**
   * Initialize Security Groups.
   * Convert `SecurityGroup[]` into array of security group ids.
   * Also create a primary security group that clients can use to add ingress rules.
   * @param extraSecurityGroups The list of extra security groups
   * @returns `SecurityGroupDetails`
   */
  private initSecurityGroup(extraSecurityGroups?: ISecurityGroup[]): SecurityGroupDetails {
    const securityGroupIds: string[] = extraSecurityGroups ? extraSecurityGroups.map((sg) => sg.securityGroupId) : [];
    const primarySecurityGroup = new SecurityGroup(this, 'DefaultSecurityGroup', {
      vpc: this.vpc,
    });

    const primaryConnections = primarySecurityGroup.connections;
    securityGroupIds.push(primarySecurityGroup.securityGroupId);

    return {
      securityGroupIds,
      primarySecurityGroup,
      primaryConnections,
    };
  }

  private initDefaultNetworking(): NetworkDetails {
    const dataVpc = new DataVpc(this, 'DefaultVpc', {
      vpcCidr: RedshiftServerlessWorkgroup.DEFAULT_VPC_CIDR,
      removalPolicy: this.removalPolicy,
    });

    return {
      vpc: dataVpc.vpc,
      selectedSubnets: dataVpc.vpc.selectSubnets({
        subnetGroupName: RedshiftServerlessWorkgroup.DEFAULT_VPC_PRIVATE_SUBNET_NAME,
      }),
    };
  }
}

interface NetworkDetails {
  vpc: IVpc;
  selectedSubnets: SelectedSubnets;
}

interface SecurityGroupDetails {
  securityGroupIds: string[];
  primarySecurityGroup: SecurityGroup;
  primaryConnections: Connections;
}