// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { createHash } from 'crypto';
import { CustomResource, Duration, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
// import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
// import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { RedshiftDataProps } from './redshift-data-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * Creates an asynchronous custom resource that handles the execution of SQL using Redshift's Data API. If `vpc` and `vpcSubnets` are passed, this construct would also create the Redshift Data Interface VPC endpoint and configure the custom resource in the same VPC subnet.
 *
 * @example
 * const workgroup = new dsf.consumption.RedshiftServerlessWorkgroup(this, "RedshiftWorkgroup", {
 *    workgroupName: "redshift-workgroup"
 * })
 *
 * const rsData = workgroup.accessData()
 * rsData.createDbRole("defaultdb", "engineering")
 */
export class RedshiftData extends TrackedConstruct {
  /**
   * Custom resource provider. This references the Lambda function that sends the SQL to Redshift via Redshift's Data API
   */
  readonly executionProvider: string;

  /**
   * The ARN of the target cluster or workgroup
   */
  readonly targetArn: string;

  /**
   * Either provisioned or serverless
   */
  readonly targetType: string;

  /**
   * The ID of the target cluster or workgroup
   */
  readonly targetId: string;

  /**
   * The managed IAM policy allowing IAM Role to retrieve tag information
   */
  readonly taggingManagedPolicy: ManagedPolicy;

  /**
   * The created Redshift Data API interface vpc endpoint
   */
  readonly redshiftDataInterfaceVpcEndpoint?: InterfaceVpcEndpoint;

  private readonly crSecurityGroup?: SecurityGroup;
  private readonly removalPolicy: RemovalPolicy;

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

    if (props.clusterIdentifier) {
      targetArn = `arn:aws:redshift:${currentStack.region}:${currentStack.account}:cluster:${props.clusterIdentifier}`;
      targetType = 'provisioned';
      targetId = props.clusterIdentifier;
    } else if (props.workgroupId) {
      targetArn = `arn:aws:redshift-serverless:${currentStack.region}:${currentStack.account}:workgroup/${props.workgroupId}`;
      targetType = 'serverless';
      targetId = props.workgroupId;
    } else {
      throw new Error('Either cluster identifier or workgroup id is required');
    }

    this.targetArn = targetArn;
    this.targetType = targetType;
    this.targetId = targetId;

    if (props.vpc && props.selectedSubnets) {
      this.crSecurityGroup = new SecurityGroup(this, 'CRSecurityGroup', {
        vpc: props.vpc,
      });

      this.crSecurityGroup.applyRemovalPolicy(this.removalPolicy);

      if (props.createInterfaceVpcEndpoint) {
        const interfaceVpcEndpointSG = new SecurityGroup(this, 'RedshiftDataInterfaceVPCEndpointSecurityGroup', {
          vpc: props.vpc,
        });

        interfaceVpcEndpointSG.addIngressRule(Peer.ipv4(props.vpc.vpcCidrBlock), Port.tcp(443));

        this.redshiftDataInterfaceVpcEndpoint = new InterfaceVpcEndpoint(this, 'RedshiftDataInterfaceVpcEndpoint', {
          vpc: props.vpc,
          subnets: props.selectedSubnets,
          service: InterfaceVpcEndpointAwsService.REDSHIFT_DATA,
          securityGroups: [interfaceVpcEndpointSG],
        });

        this.redshiftDataInterfaceVpcEndpoint.applyRemovalPolicy(this.removalPolicy);

        this.redshiftDataInterfaceVpcEndpoint.connections.allowFrom(this.crSecurityGroup, Port.tcp(443));
      }
    }

    const crExecRole = new Role(this, 'RSDataLambdaExecRole', {
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
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              resources: [
                props.secretKmsKey.keyArn,
              ],
            }),
          ],
        }),
      },
    });

    crExecRole.applyRemovalPolicy(this.removalPolicy);

    props.secret.grantRead(crExecRole);

    // const redshiftDataExecutionFunction = new Function(this, 'RSDataExecutionFunction', {
    //   runtime: Runtime.NODEJS_LATEST,
    //   role: crExecRole,
    //   handler: 'index.onEventHandler',
    //   code: Code.fromAsset(__dirname+'/../resources/RedshiftDataExecution/'),
    //   environment: {
    //     TARGET_ARN: targetArn,
    //     TARGET_TYPE: targetType,
    //     SECRET_NAME: props.secret.secretArn,
    //   },
    //   timeout: Duration.minutes(5),
    //   vpc: props.vpc,
    //   vpcSubnets: props.selectedSubnets,
    //   securityGroups: this.crSecurityGroup ? [this.crSecurityGroup] : [],
    // });

    // redshiftDataExecutionFunction.applyRemovalPolicy(this.removalPolicy);

    // const redshiftDataExecutionIsCompleteFunction = new Function(this, 'RSDataExecutionIsCompleteFunction', {
    //   runtime: Runtime.NODEJS_LATEST,
    //   role: crExecRole,
    //   handler: 'index.isCompleteHandler',
    //   code: Code.fromAsset(__dirname+'/../resources/RedshiftDataExecution/'),
    //   environment: {
    //     TARGET_ARN: targetArn,
    //     TARGET_TYPE: targetType,
    //     TARGET_ID: targetId,
    //     SECRET_NAME: props.secret.secretArn,
    //   },
    //   timeout: Duration.minutes(5),
    //   vpc: props.vpc,
    //   vpcSubnets: props.selectedSubnets,
    //   securityGroups: this.crSecurityGroup ? [this.crSecurityGroup] : [],
    // });

    // redshiftDataExecutionIsCompleteFunction.applyRemovalPolicy(this.removalPolicy);

    const provider = new DsfProvider(this, 'RSDSFDataExecutionProvider', {
      providerName: 'RSDSFDataExecutionProvider',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/../resources/RedshiftDataExecution/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataExecution/index.mjs',
        handler: 'index.onEventHandler',
        environment: {
          TARGET_ARN: targetArn,
          TARGET_TYPE: targetType,
          SECRET_NAME: props.secret.secretArn,
        },
        iamRole: crExecRole,
        timeout: Duration.minutes(5),
      },
      isCompleteHandlerDefinition: {
        iamRole: crExecRole,
        handler: 'index.isCompleteHandler',
        depsLockFilePath: __dirname+'/../resources/RedshiftDataExecution/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftDataExecution/index.mjs',
        timeout: Duration.minutes(5),
        environment: {
          TARGET_ARN: targetArn,
          TARGET_TYPE: targetType,
          TARGET_ID: targetId,
          SECRET_NAME: props.secret.secretArn,
        },
      },
      vpc: props.vpc,
      subnets: props.selectedSubnets,
      securityGroups: this.crSecurityGroup ? [this.crSecurityGroup] : [],
      queryInterval: Duration.seconds(1),
      removalPolicy: this.removalPolicy,
    });

    this.executionProvider = provider.serviceToken;

    this.taggingManagedPolicy = new ManagedPolicy(this, 'RedshiftTaggingManagedPolicy', {
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

    this.taggingManagedPolicy.applyRemovalPolicy(this.removalPolicy);

    // this.executionProvider = new Provider(this, 'RSDataExecutionProvider', {
    //   onEventHandler: redshiftDataExecutionFunction,
    //   isCompleteHandler: redshiftDataExecutionIsCompleteFunction,
    //   queryInterval: Duration.seconds(1),
    //   totalTimeout: props.executionTimeout || Duration.minutes(1),
    // });
  }

  /**
   * Runs a custom SQL. Once the custom resource finishes execution, the attribute `Data` contains an attribute `execId` which contains the Redshift Data API execution ID. You can then use this to retrieve execution results via the `GetStatementResult` API.
   * @param databaseName The name of the database to run this command
   * @param sql The sql to run
   * @param deleteSql Optional. The sql to run when this resource gets deleted
   * @returns `CustomResource`
   */
  public runCustomSQL(databaseName: string, sql: string, deleteSql?: string): CustomResource {
    const hash = createHash('sha256').update(`${databaseName}${sql}${deleteSql}`).digest('hex');
    const uniqueId = `CustomSQL-${this.targetType}-${databaseName}-${hash}`;

    return new CustomResource(this, uniqueId, {
      serviceToken: this.executionProvider,
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
   * @param databaseName The name of the database to run this command
   * @param roleName The name of the role to create
   * @returns `CustomResource`
   */
  public createDbRole(databaseName: string, roleName: string): CustomResource {
    return this.runCustomSQL(databaseName, `create role ${roleName}`, `drop role ${roleName}`);
  }

  /**
   * Grants access to the schema to the DB role
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantDbSchemaToRole(databaseName: string, schema: string, roleName: string): CustomResource {
    return this.runCustomSQL(databaseName, `grant usage on schema ${schema} to role ${roleName}`, `revoke usage on schema ${schema} from role ${roleName}`);
  }

  /**
   * Grants read permission on all the tables in the `schema` to the DB role
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantDbReadToRole(databaseName: string, schema: string, roleName: string): CustomResource {
    return this.runCustomSQL(databaseName, `grant select on all tables in schema ${schema} to role ${roleName}`, `revoke select on all tables in schema ${schema} from role ${roleName}`);
  }

  /**
   * Grants both read and write permissions on all the tables in the `schema` to the DB role
   * @param databaseName The name of the database to run this command
   * @param schema The schema where the tables are located in
   * @param roleName The DB role to grant the permissions to
   * @returns `CustomResource`
   */
  public grantDbAllPrivilegesToRole(databaseName: string, schema: string, roleName: string): CustomResource {
    return this.runCustomSQL(databaseName, `grant all on all tables in schema ${schema} to role ${roleName}`, `revoke all on all tables in schema ${schema} from role ${roleName}`);
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
   * @param databaseName The name of the database to run this command
   * @param targetTable The target table to load the data into
   * @param sourceBucket The bucket where the source data would be coming from
   * @param sourcePrefix The location inside the bucket where the data would be ingested from
   * @param ingestAdditionalOptions Optional. Additional options to pass to the `COPY` command. For example, `delimiter '|'` or `ignoreheader 1`
   * @param role Optional. The IAM Role to use to access the data in S3. If not provided, it would use the default IAM role configured in the Redshift Namespace
   * @returns
   */
  public ingestData(databaseName: string, targetTable: string, sourceBucket: IBucket, sourcePrefix: string,
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

    return this.runCustomSQL(databaseName, sql);
  }

  /**
   * Runs the `MERGE` query using simplified mode. This command would do an upsert into the target table.
   * @param databaseName The name of the database to run this command
   * @param sourceTable The source table name. Schema can also be included using the following format: `schemaName.tableName`
   * @param targetTable The target table name. Schema can also be included using the following format: `schemaName.tableName`
   * @param sourceColumnId The column in the source table that's used to determine whether the rows in the `sourceTable` can be matched with rows in the `targetTable`. Default is `id`
   * @param targetColumnId The column in the target table that's used to determine whether the rows in the `sourceTable` can be matched with rows in the `targetTable`. Default is `id`
   * @returns `CustomResource`
   */
  public mergeToTargetTable(databaseName: string, sourceTable: string, targetTable: string, sourceColumnId?: string
    , targetColumnId?: string): CustomResource {
    const actualSourceColumnId = sourceColumnId || 'id';
    const actualTargetColumnId = targetColumnId || 'id';

    let sql = `merge into ${targetTable} using ${sourceTable} on ${targetTable}.${actualTargetColumnId}=${sourceTable}.${actualSourceColumnId} remove duplicates`;

    return this.runCustomSQL(databaseName, sql);
  }
}