// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Connections, IConnectable, ISecurityGroup, IVpc, Port, SecurityGroup, SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { CfnConnection } from 'aws-cdk-lib/aws-glue';
import { CfnWorkgroup } from 'aws-cdk-lib/aws-redshiftserverless';
import { Construct } from 'constructs';
import { RedshiftServerlessNamespace } from './redshift-serverless-namespace';
import { RedshiftServerlessWorkgroupProps } from './redshift-serverless-workgroup-props';
import { DataCatalogDatabase } from '../../../../governance';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../../utils';
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

  private readonly removalPolicy: RemovalPolicy;
  private redshiftData?: RedshiftData;
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

    this.cfnResource = new CfnWorkgroup(this, 'Workgroup', {
      workgroupName: `${props.name}${Utils.generateUniqueHash(this, id)}`,
      baseCapacity: props.baseCapacity,
      enhancedVpcRouting: true,
      namespaceName: props.namespace.namespaceName,
      port: this.port,
      publiclyAccessible: false,
      subnetIds: this.selectedSubnets.subnetIds,
      securityGroupIds: initSecurityGroupDetails.securityGroupIds,
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
      jdbcSecretKMSKey: this.namespace.dataKey,
      jdbcPath: pathToCrawl,
      removalPolicy: this.removalPolicy,
    });

    catalog.node.addDependency(this.glueConnection);

    return catalog;
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
   * @param createVpcEndpoint if set to true, create interface VPC endpoint for Redshift Data API
   * @returns `RedshiftData`
   */
  public accessData(id: string, createVpcEndpoint?: boolean): RedshiftData {

    if (!this.redshiftData) {
      this.redshiftData = new RedshiftData(this, id, {
        secret: this.namespace.adminSecret,
        secretKey: this.namespace.adminSecretKey,
        workgroupId: this.cfnResource.attrWorkgroupWorkgroupId,
        vpc: this.vpc,
        subnets: this.selectedSubnets,
        createInterfaceVpcEndpoint: createVpcEndpoint,
        removalPolicy: this.removalPolicy,
      });

      this.redshiftData.node.addDependency(this.cfnResource);
    }

    return this.redshiftData;
  }

  /**
   * Initialize Security Groups.
   * Convert `SecurityGroup[]` into array of security group ids.
   * Also create a primary security group that clients can use to add ingress rules.
   * @param props `RedshiftServerlessWorkgroupProps`
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