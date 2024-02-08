// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// import { createHash } from 'crypto';
import { CustomResource, Duration, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { ISecurityGroup, InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Effect, IManagedPolicy, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RedshiftDataProps } from './redshift-data-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../../utils';
import { DsfProvider } from '../../../../utils/lib/dsf-provider';

/**
 * Creates an asynchronous custom resource that handles the execution of SQL using Redshift's Data API. If `vpc` and `vpcSubnets` are passed, this construct would also create the Redshift Data Interface VPC endpoint and configure the custom resource in the same VPC subnet.
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
 * const rsData = workgroup.accessData('DataApi');
 * rsData.createDbRole("EngineeringRole", "defaultdb", "engineering");
 */
export class RedshiftData extends TrackedConstruct {

  /**
   * The CloudWatch Log Group for the Redshift Data API submission
   */
  public readonly submitLogGroup: ILogGroup;
  /**
   * The Lambda Function for the Redshift Data submission
   */
  public readonly submitFunction: IFunction;
  /**
   * The IAM Role for the Redshift Data API execution
   */
  public readonly executionRole: IRole;

  /**
   * The CloudWatch Log Group for the Redshift Data API status checks
   */
  public readonly statusLogGroup: ILogGroup;
  /**
   * The Lambda Function for the Redshift Data API status checks
   */
  public readonly statusFunction: IFunction;

  /**
   * The CloudWatch Log Group for the Redshift Data cleaning up lambda
   */
  public readonly cleanUpLogGroup?: ILogGroup;
  /**
   * The Lambda function for the S3 data copy cleaning up lambda
   */
  public readonly cleanUpFunction?: IFunction;
  /**
   * The IAM Role for the the S3 data copy cleaning up lambda
   */
  public readonly cleanUpRole?: IRole;

  /**
   * The ARN of the target cluster or workgroup
   */
  public readonly targetArn: string;

  /**
   * The ID of the target cluster or workgroup
   */
  public readonly targetId: string;

  /**
   * The managed IAM policy allowing IAM Role to retrieve tag information
   */
  public readonly taggingManagedPolicy: IManagedPolicy;

  /**
   * The created Redshift Data API interface vpc endpoint when deployed in a VPC
   */
  public readonly vpcEndpoint?: InterfaceVpcEndpoint;

  /**
   * The Security Group used by the Custom Resource when deployed in a VPC
   */
  public readonly customResourceSecurityGroup?: ISecurityGroup;

  /**
   * The Security Group used by the VPC Endpoint when deployed in a VPC
   */
  public readonly vpcEndpointSecurityGroup?: ISecurityGroup;

  private readonly removalPolicy: RemovalPolicy;
  private readonly serviceToken: string;


  constructor(scope: Construct, id: string, props: RedshiftDataProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: RedshiftData.name,
    };

    super(scope, id, trackedConstructProps);

    const currentStack = Stack.of(this);

    let targetArn: string|undefined;
    let targetType: string|undefined;
    let targetId: string|undefined;
    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    if (props.clusterId) {
      targetArn = `arn:aws:redshift:${currentStack.region}:${currentStack.account}:cluster:${props.clusterId}`;
      targetType = 'provisioned';
      targetId = props.clusterId;
    } else if (props.workgroupId) {
      targetArn = `arn:aws:redshift-serverless:${currentStack.region}:${currentStack.account}:workgroup/${props.workgroupId}`;
      targetType = 'serverless';
      targetId = props.workgroupId;
    } else {
      throw new Error('Either cluster identifier or workgroup id is required');
    }

    this.targetArn = targetArn;
    this.targetId = targetId;

    if (props.vpc && props.subnets) {
      this.customResourceSecurityGroup = new SecurityGroup(this, 'CrSecurityGroup', {
        vpc: props.vpc,
      });

      if (props.createInterfaceVpcEndpoint) {
        this.vpcEndpointSecurityGroup = new SecurityGroup(this, 'InterfaceVpcEndpointSecurityGroup', {
          vpc: props.vpc,
        });

        this.vpcEndpointSecurityGroup.addIngressRule(Peer.ipv4(props.vpc.vpcCidrBlock), Port.tcp(443));

        this.vpcEndpoint = new InterfaceVpcEndpoint(this, 'InterfaceVpcEndpoint', {
          vpc: props.vpc,
          subnets: props.subnets,
          service: InterfaceVpcEndpointAwsService.REDSHIFT_DATA,
          securityGroups: [this.vpcEndpointSecurityGroup],
        });

        this.vpcEndpoint.connections.allowFrom(this.customResourceSecurityGroup, Port.tcp(443));
      }
    }

    this.executionRole = new Role(this, 'ExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        RedshiftDataPermission: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'redshift-data:BatchExecuteStatement',
                'redshift-data:ExecuteStatement',
              ],
              resources: [
                targetArn,
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'redshift-data:DescribeStatement',
                'redshift-data:CancelStatement',
                'redshift-data:GetStatementResult',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
    if (props.secretKey) props.secretKey.grantDecrypt(this.executionRole);
    props.secret.grantRead(this.executionRole);

    const timeout = props.executionTimeout || Duration.minutes(5);

    const provider = new DsfProvider(this, 'CrProvider', {
      providerName: 'RedshiftDataProvider',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/../resources/RedshiftDataExecution/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataExecution/index.mjs',
        handler: 'index.onEventHandler',
        environment: {
          TARGET_ARN: targetArn,
          TARGET_TYPE: targetType,
          SECRET_NAME: props.secret.secretArn,
        },
        iamRole: this.executionRole,
        timeout,
      },
      isCompleteHandlerDefinition: {
        iamRole: this.executionRole,
        handler: 'index.isCompleteHandler',
        depsLockFilePath: __dirname+'/../resources/RedshiftDataExecution/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataExecution/index.mjs',
        timeout,
        environment: {
          TARGET_ARN: targetArn,
          TARGET_TYPE: targetType,
          TARGET_ID: targetId,
          SECRET_NAME: props.secret.secretArn,
        },
      },
      vpc: props.vpc,
      subnets: props.subnets,
      securityGroups: this.customResourceSecurityGroup ? [this.customResourceSecurityGroup] : [],
      queryInterval: Duration.seconds(1),
      removalPolicy: this.removalPolicy,
    });

    this.serviceToken = provider.serviceToken;
    this.submitLogGroup = provider.onEventHandlerLogGroup;
    this.statusLogGroup = provider.isCompleteHandlerLog!;
    this.cleanUpLogGroup = provider.cleanUpLogGroup;
    this.submitFunction = provider.onEventHandlerFunction;
    this.statusFunction = provider.isCompleteHandlerFunction!;
    this.cleanUpFunction = provider.cleanUpFunction;
    this.cleanUpRole = provider.cleanUpRole;

    this.taggingManagedPolicy = new ManagedPolicy(this, 'TaggingManagedPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'tag:GetResources',
            'tag:GetTagKeys',
          ],
          resources: ['*'],
        }),
      ],
    });
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
    // const hash = createHash('sha256').update(`${databaseName}${sql}${deleteSql}`).digest('hex');
    // const uniqueId = `CustomSql${hash}`;

    return new CustomResource(this, id, {
      resourceType: 'Custom::RedshiftDataSql',
      serviceToken: this.serviceToken,
      properties: {
        sql: sql,
        deleteSql: deleteSql,
        databaseName,
      },
      removalPolicy: this.removalPolicy,
    });
  }

  /**
   * Creates a new DB role
   * @param id The CDK Construct ID
   * @param databaseName The name of the database to run this command
   * @param roleName The name of the role to create
   * @returns `CustomResource`
   */
  public createDbRole(id: string, databaseName: string, roleName: string): CustomResource {
    return this.runCustomSQL(id, databaseName, `create role ${roleName}`, `drop role ${roleName}`);
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
    return this.runCustomSQL(id, databaseName, `grant usage on schema ${schema} to role ${roleName}`, `revoke usage on schema ${schema} from role ${roleName}`);
  }

  /**
   * Grants read permission on all the tables in the `schema` to the DB role
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantSchemaReadToRole(id: string, databaseName: string, schema: string, roleName: string): CustomResource {
    return this.runCustomSQL(id, databaseName, `grant select on all tables in schema ${schema} to role ${roleName}`, `revoke select on all tables in schema ${schema} from role ${roleName}`);
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
    return this.runCustomSQL(id, databaseName, `grant all on all tables in schema ${schema} to role ${roleName}`, `revoke all on all tables in schema ${schema} from role ${roleName}`);
  }

  /**
   * Assigns Redshift DB roles to IAM role vs the `RedshiftDbRoles` tag
   * @param dbRoles List of Redshift DB roles to assign to IAM role
   * @param targetRole The IAM role to assign the Redshift DB roles to
   */
  public assignDbRolesToIAMRole(dbRoles: string[], targetRole: IRole) {
    targetRole.addManagedPolicy(this.taggingManagedPolicy);
    Tags.of(targetRole).add('RedshiftDbRoles', dbRoles.join(':'));
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
    let sql = `copy ${targetTable} from 's3://${sourceBucket.bucketName}/${sourcePrefix}'`;

    if (role) {
      sql += ` iam_role '${role.roleArn}'`;
    } else {
      sql += ' iam_role default';
    }

    if (ingestAdditionalOptions) {
      sql += ` ${ingestAdditionalOptions}`;
    }

    return this.runCustomSQL(id, databaseName, sql);
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
    const actualSourceColumnId = sourceColumnId || 'id';
    const actualTargetColumnId = targetColumnId || 'id';

    let sql = `merge into ${targetTable} using ${sourceTable} on ${targetTable}.${actualTargetColumnId}=${sourceTable}.${actualSourceColumnId} remove duplicates`;

    return this.runCustomSQL(id, databaseName, sql);
  }
}