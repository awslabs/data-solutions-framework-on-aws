// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'crypto';
import { Names, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IConnectable, IVpc, Port, SecurityGroup, SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { CfnConnection } from 'aws-cdk-lib/aws-glue';
import { CfnWorkgroup } from 'aws-cdk-lib/aws-redshiftserverless';
import { Construct } from 'constructs';
import { RedshiftServerlessNamespace } from './redshift-serverless-namespace';
import { RedshiftServerlessWorkgroupProps } from './redshift-serverless-workgroup-props';
import { DataCatalogDatabase } from '../../../governance';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';
import { RedshiftData } from '../redshift/redshift-data';

const DEFAULT_PORT = 5439;

/**
 * Create a Redshift Serverless Workgroup. A default namespace would be created if none is provided.
 *
 * @example
 * const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "RedshiftWorkgroup", {
 *    workgroupName: "redshift-workgroup"
 * })
 */
export class RedshiftServerlessWorkgroup extends TrackedConstruct implements IConnectable {
  private static readonly DEFAULT_VPC_CIDR = '10.0.0.0/16';
  private static readonly DEFAULT_VPC_PRIVATE_SUBNET_NAME = 'Private';

  /**
   * The created workgroup
   */
  readonly cfnResource: CfnWorkgroup;

  /**
   * The name of the created workgroup
   */
  readonly workgroupName: string;

  /**
   * Connections used by Workgroup security group. Used this to enable access from clients connecting to the workgroup
   */
  readonly connections: Connections;

  /**
   * The associated namespace
   */
  readonly namespace: RedshiftServerlessNamespace;

  /**
   * The name of the associated namespace
   */
  readonly namespaceName: string;

  /**
   * The Glue connection associated with the workgroup. This can be used by Glue ETL Jobs to read/write data from/to Redshift workgroup
   */
  readonly glueConnection: CfnConnection;

  private readonly primarySecurityGroup: SecurityGroup;
  private readonly removalPolicy: RemovalPolicy;
  private redshiftData?: RedshiftData;
  private readonly vpc: IVpc;
  private readonly selectedSubnets: SelectedSubnets;

  constructor(scope: Construct, id: string, props: RedshiftServerlessWorkgroupProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: RedshiftServerlessWorkgroup.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
    const initNamespaceDetails = this.initNamespace(props);
    this.namespace = initNamespaceDetails.namespace;
    this.namespaceName = initNamespaceDetails.namespaceName;

    if (props.vpc && props.subnets) {
      this.vpc = props.vpc;
      this.selectedSubnets = props.vpc.selectSubnets(props.subnets);
    } else {
      const networkDetails = this.initDefaultNetworking();

      this.vpc = networkDetails.vpc;
      this.selectedSubnets = networkDetails.selectedSubnets;
    }

    const initSecurityGroupDetails = this.initSecurityGroup(props);
    this.primarySecurityGroup = initSecurityGroupDetails.primarySecurityGroup;
    this.connections = initSecurityGroupDetails.primaryConnections;

    const subnetIds = this.selectedSubnets.subnetIds;
    this.workgroupName = `${props.workgroupName}-${Names.uniqueResourceName(this, { maxLength: 63 - (props.workgroupName.length + 1) }).toLowerCase()}`;


    this.cfnResource = new CfnWorkgroup(
      this,
      'RSServerlessWorkgroup',
      {
        workgroupName: this.workgroupName,
        baseCapacity: props.baseCapacity,
        enhancedVpcRouting: true,
        namespaceName: this.namespaceName,
        port: props.port,
        publiclyAccessible: false,
        subnetIds,
        securityGroupIds: initSecurityGroupDetails.securityGroupIds,
      },
    );

    this.cfnResource.applyRemovalPolicy(this.removalPolicy);
    this.cfnResource.node.addDependency(this.namespace.cfnResource);
    this.glueConnection = this.createConnection(props);
  }

  /**
   * Creates a new Glue data catalog database with a crawler using JDBC target type to connect to the Redshift Workgroup
   * @param catalogDbName `string`
   * @param pathToCrawl `string` @default `<databaseName>/public/%
   * @returns `DataCatalogDatabase`
   */
  public catalogTables(catalogDbName: string, pathToCrawl?: string): DataCatalogDatabase {
    if (!pathToCrawl) {
      pathToCrawl = `${this.namespace.dbName}/public/%`;
    }

    const hash = Utils.generateHash(`${this.workgroupName}-${this.namespaceName}-${this.namespace.dbName}-${catalogDbName}-${pathToCrawl}`);
    const catalog = new DataCatalogDatabase(this, `RS-Serverless-Catalog-${hash}`, {
      name: catalogDbName,
      glueConnectionName: `glue-conn-${this.cfnResource.workgroupName}`,
      jdbcSecret: this.namespace.adminSecret,
      jdbcSecretKMSKey: this.namespace.namespaceKey,
      jdbcPath: pathToCrawl,
      removalPolicy: this.removalPolicy,
    });

    catalog.node.addDependency(this.glueConnection);

    return catalog;
  }

  /**
     * Create Glue Connection and modifies the Redshift Serverless Workgroup's security group to allow Glue access via self-referencing rule
     * @param selectedSubnets `SelectedSubnets`
     * @returns `CfnConnection`
     */
  private createConnection(props: RedshiftServerlessWorkgroupProps): CfnConnection {
    const subnet = this.selectedSubnets.subnets[0];
    this.connections.allowFrom(this, Port.allTcp());

    const connection = new CfnConnection(this, 'WorkgroupGlueConnection', {
      catalogId: Stack.of(this).account,
      connectionInput: {
        name: `glue-conn-${this.cfnResource.workgroupName}`,
        connectionType: 'JDBC',
        connectionProperties: {
          JDBC_CONNECTION_URL: `jdbc:redshift://${this.cfnResource.attrWorkgroupEndpointAddress}:${props.port || DEFAULT_PORT}/${this.namespace.dbName}`,
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
   * @param createRSDataInterfaceVpcEndpoint if set to true, create interface VPC endpoint for Redshift Data API
   * @returns `RedshiftData`
   */
  public accessData(createRSDataInterfaceVpcEndpoint?: boolean): RedshiftData {
    if (!this.redshiftData) {
      const idHash = createHash('sha256').update(`FromWorkgroup-${this.workgroupName}-${this.namespaceName}`).digest('hex');
      this.redshiftData = new RedshiftData(this, `RSServerlessDataAPI-${idHash}`, {
        secret: this.namespace.adminSecret,
        workgroupId: this.cfnResource.attrWorkgroupWorkgroupId,
        vpc: this.vpc,
        selectedSubnets: this.selectedSubnets,
        createInterfaceVpcEndpoint: createRSDataInterfaceVpcEndpoint,
        secretKmsKey: this.namespace.namespaceKey,
        removalPolicy: this.removalPolicy,
      });

      this.redshiftData.node.addDependency(this.cfnResource);
    }

    return this.redshiftData;
  }

  /**
   * Handle numerous namespace initialization scenarios and flatten the response into the `NamespaceDetails` interface. This handles the following scenarios:
   * - If a `RedshiftServerlessNamespace` object has been passed
   * - If no namespace has been passed, a default one would be created
   * @param props `RedshiftServerlessWorkgroupProps`
   * @returns `NamespaceDetails`
   */
  private initNamespace(props: RedshiftServerlessWorkgroupProps): NamespaceDetails {
    if (props.namespace) {
      return {
        namespaceName: props.namespace.namespaceName,
        namespace: props.namespace,
      };
    } else {

      const namespace = new RedshiftServerlessNamespace(this, 'DefaultServerlessNamespace', {
        dbName: 'defaultdb',
        name: 'default',
        removalPolicy: this.removalPolicy,
        defaultIAMRole: props.defaultNamespaceDefaultIAMRole,
        iamRoles: props.defaultNamespaceIAMRoles,
      });
      const namespaceName = namespace.namespaceName;

      return {
        namespaceName,
        namespace,
      };
    }
  }

  /**
     * Convert `SecurityGroup[]` into array of security group ids. Also create a primary security group that clients can use to add ingress rules.
     * @param props `RedshiftServerlessWorkgroupProps`
     * @returns `SecurityGroupDetails`
     */
  private initSecurityGroup(props: RedshiftServerlessWorkgroupProps): SecurityGroupDetails {
    const securityGroupIds: string[] = props.securityGroups ? props.securityGroups.map((sg) => sg.securityGroupId) : [];
    const primarySecurityGroup = new SecurityGroup(this, 'RSServerlessPrimarySG', {
      vpc: this.vpc,
    });
    primarySecurityGroup.applyRemovalPolicy(this.removalPolicy);

    const primaryConnections = primarySecurityGroup.connections;
    securityGroupIds.push(primarySecurityGroup.securityGroupId);

    return {
      securityGroupIds,
      primarySecurityGroup,
      primaryConnections,
    };
  }

  private initDefaultNetworking(): NetworkDetails {
    const dataVpc = new DataVpc(this, 'DefaultVPC', {
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

interface NamespaceDetails {
  namespaceName: string;
  namespace: RedshiftServerlessNamespace;
}

interface SecurityGroupDetails {
  securityGroupIds: string[];
  primarySecurityGroup: SecurityGroup;
  primaryConnections: Connections;
}