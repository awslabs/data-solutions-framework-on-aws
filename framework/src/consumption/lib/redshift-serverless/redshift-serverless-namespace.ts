// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'crypto';
import { RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { Effect, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { RedshiftServerlessNamespaceProps } from './redshift-serverless-namespace-props';
import { Context, TrackedConstruct, TrackedConstructProps, Utils } from '../../../utils';

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
   * Created namespace
   */
  readonly cfnResource: AwsCustomResource;

  /**
   * The name of the created namespace
   */
  readonly namespaceName: string;

  /**
   * The created Secrets Manager secret containing the admin credentials
   */
  readonly adminSecret: ISecret;

  /**
   * The roles attached to the namespace.
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
    const namespaceArn = `arn:aws:redshift-serverless:${this.currentStack.region}:${this.currentStack.account}:namespace/*`;

    this.namespaceParameters = {
      namespaceName: this.namespaceName,
      adminPasswordSecretKmsKeyId: this.namespaceKey.keyId,
      adminUsername: `admin-${randomBytes(4).toString('hex')}`,
      dbName: props.dbName,
      defaultIamRoleArn: props.defaultIAMRole ? props.defaultIAMRole.roleArn : undefined,
      iamRoles: this.roles ? Object.keys(this.roles) : undefined,
      kmsKeyId: this.namespaceKey.keyId,
      manageAdminPassword: true,
      logExports,
    };

    const roleArns = Object.keys(this.roles);

    const createNamespaceCrPolicyStatements = [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'redshift-serverless:CreateNamespace',
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
        resources: [this.namespaceKey.keyArn],
      }),
    ];

    if (roleArns && roleArns.length > 0) {
      createNamespaceCrPolicyStatements.push(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'iam:PassRole',
        ],
        resources: roleArns,
      }));
    }

    this.cfnResource = new AwsCustomResource(this, 'RSServerlessNamespace', {
      onCreate: {
        service: 'redshift-serverless',
        action: 'CreateNamespace',
        parameters: this.namespaceParameters,
        physicalResourceId: PhysicalResourceId.of(`RS-${this.currentStack.region}-${this.currentStack.account}-${this.namespaceName}`),
      },
      onUpdate: {
        service: 'redshift-serverless',
        action: 'UpdateNamespace',
        parameters: {
          namespaceName: this.namespaceName,
          defaultIamRoleArn: props.defaultIAMRole ? props.defaultIAMRole.roleArn : undefined,
          iamRoles: this.roles ? roleArns : undefined,
        },
      },
      onDelete: {
        service: 'redshift-serverless',
        action: 'DeleteNamespace',
        parameters: {
          namespaceName: this.namespaceName,
        },
      },
      policy: AwsCustomResourcePolicy.fromStatements(createNamespaceCrPolicyStatements),
      installLatestAwsSdk: true,
      removalPolicy: this.removalPolicy,
    });

    this.cfnResource.node.addDependency(this.namespaceKey);

    this.adminSecret = Secret.fromSecretCompleteArn(this, 'NamespaceManagedSecret', this.cfnResource.getResponseField('namespace.adminPasswordSecretArn'));
    this.namespaceId = this.cfnResource.getResponseField('namespace.namespaceId');
    this.namespaceArn = this.cfnResource.getResponseField('namespace.namespaceArn');
    Tags.of(this.adminSecret).add('RedshiftDataFullAccess', 'serverless');
  }
}