// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Effect, IRole, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { RedshiftServerlessNamespaceProps } from './redshift-serverless-namespace-props';
import { Context, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * Create a Redshift Serverless Namespace with the admin credentials stored in Secrets Manager
 *
 * @example
 * const namespace = new dsf.consumption.RedshiftServerlessNamespace(this, 'DefaultServerlessNamespace', {
 *    dbName: 'defaultdb',
 *    name: 'default'
 * });
 */
export class RedshiftServerlessNamespace extends TrackedConstruct {

  /**
   * The custom resource that creates the Namespace
   */
  readonly cfnResource: CustomResource;

  /**
   * The name of the created namespace
   */
  readonly namespaceName: string;

  /**
   * The created Secrets Manager secret containing the admin credentials
   */
  readonly adminSecret: ISecret;

  /**
   * The KMS Key used to encrypt the admin credentials secret
   */
  readonly adminSecretKey: IKey;

  /**
   * The roles attached to the namespace in the form of `{RoleArn: IRole}`.
   * These roles are used to access other AWS services for ingestion, federated query, and data catalog access.
   * @see https://docs.aws.amazon.com/redshift/latest/mgmt/redshift-iam-authentication-access-control.html
   */
  readonly roles: Record<string, IRole>;

  /**
   * KMS key used by the namespace to encrypt its data
   */
  readonly namespaceKey: Key;

  /**
   * The name of the database
   */
  readonly dbName: string;

  /**
   * The ARN of the created namespace
   */
  readonly namespaceArn: string;

  /**
   * The ID of the created namespace
   */
  readonly namespaceId: string;

  private readonly removalPolicy: RemovalPolicy;

  /**
   * Used for convenient access to Stack related information such as region and account id.
   */
  private readonly currentStack: Stack;
  private namespaceParameters: { [key:string]: any };

  constructor(scope: Construct, id: string, props: RedshiftServerlessNamespaceProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: RedshiftServerlessNamespace.name,
    };

    super(scope, id, trackedConstructProps);

    this.roles = {};
    this.currentStack = Stack.of(this);

    if (props.iamRoles) {
      for (const role of props.iamRoles) {
        this.roles[role.roleArn] = role;
      }
    }

    if (props.defaultIAMRole) {
      this.roles[props.defaultIAMRole.roleArn] = props.defaultIAMRole;
    }

    this.dbName = props.dbName;
    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
    const logExports: string[] = props.logExports || [];
    this.namespaceName = `${props.name}-${Utils.generateUniqueHash(this)}`;
    this.namespaceKey = props.kmsKey ?? new Key(this, 'DefaultNamespaceKey', { enableKeyRotation: true, removalPolicy: this.removalPolicy });
    this.adminSecretKey = props.managedAdminPasswordKmsKey ?? new Key(this, 'DefaultManagedAdminPasswordKey', { enableKeyRotation: true, removalPolicy: this.removalPolicy });
    const namespaceArn = `arn:aws:redshift-serverless:${this.currentStack.region}:${this.currentStack.account}:namespace/*`;
    const indexParameterName = `updateNamespace-idx-${Utils.generateUniqueHash(this)}`;
    this.namespaceParameters = {
      namespaceName: this.namespaceName,
      managedAdminPasswordKeyId: this.adminSecretKey.keyId,
      adminUsername: 'admin',
      dbName: props.dbName,
      defaultIamRoleArn: props.defaultIAMRole ? props.defaultIAMRole.roleArn : undefined,
      iamRoles: this.roles ? Object.keys(this.roles) : undefined,
      kmsKeyId: this.namespaceKey.keyId,
      manageAdminPassword: true,
      logExports,
      indexParameterName,
    };

    const roleArns = Object.keys(this.roles);

    // The IAM Policy for the custom resource to create the namespace
    const createNamespaceCrPolicyStatements = [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:PutParameter',
          'ssm:DeleteParameter',
        ],
        resources: [
          `arn:aws:ssm:${this.currentStack.region}:${this.currentStack.account}:parameter/${indexParameterName}`,
        ],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'redshift-serverless:CreateNamespace',
          'redshift-serverless:GetNamespace',
          'redshift-serverless:UpdateNamespace',
          'redshift-serverless:DeleteNamespace',
        ],
        resources: [namespaceArn],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'secretsmanager:CreateSecret',
          'secretsmanager:TagResource',
          'secretsmanager:DeleteSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.currentStack.region}:${this.currentStack.account}:secret:redshift!*`,
        ],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'secretsmanager:RotateSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.currentStack.region}:${this.currentStack.account}:secret:redshift!*`,
        ],
        conditions: {
          StringEquals: {
            'aws:ResourceTag/aws:secretsmanager:owningService': 'redshift',
          },
        },
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
          'kms:CreateGrant',
        ],
        resources: [this.namespaceKey.keyArn, this.adminSecretKey.keyArn],
      }),
    ];

    // If there are IAM Roles to configure in the namespace, we grant to the custom resource pass role for these roles
    if (roleArns && roleArns.length > 0) {
      createNamespaceCrPolicyStatements.push(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'iam:PassRole',
        ],
        resources: roleArns,
      }));
    }

    const namespaceCrRole = new Role(this, 'ManagementRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        PrimaryPermissions: new PolicyDocument({
          statements: createNamespaceCrPolicyStatements,
        }),
      },
    });

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'RedshiftServerlessNamespace',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/../resources/RedshiftServerlessNamespace/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftServerlessNamespace/index.mjs',
        handler: 'index.handler',
        iamRole: namespaceCrRole,
        timeout: Duration.minutes(5),
      },
      isCompleteHandlerDefinition: {
        depsLockFilePath: __dirname+'/../resources/RedshiftServerlessNamespace/package-lock.json',
        entryFile: __dirname+'/../resources/RedshiftServerlessNamespace/index.mjs',
        handler: 'index.isCompleteHandler',
        iamRole: namespaceCrRole,
        timeout: Duration.minutes(5),
      },
      queryInterval: Duration.seconds(1),
      queryTimeout: Duration.minutes(5),
      removalPolicy: this.removalPolicy,
    });

    this.cfnResource = new CustomResource(this, 'CustomResource', {
      resourceType: 'Custom::RedshiftServerlessNamespace',
      serviceToken: provider.serviceToken,
      properties: this.namespaceParameters,
    });

    this.cfnResource.node.addDependency(this.namespaceKey);
    this.cfnResource.node.addDependency(this.adminSecretKey);

    this.adminSecret = Secret.fromSecretCompleteArn(this, 'ManagedSecret', this.cfnResource.getAttString('adminPasswordSecretArn'));
    this.namespaceId = this.cfnResource.getAttString('namespaceId');
    this.namespaceArn = this.cfnResource.getAttString('namespaceArn');
  }
}