// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { RedshiftServerlessNamespace, RedshiftServerlessNamespaceLogExport } from '../../../src/consumption';


/**
 * Tests RedshiftServerlessNamespace construct
 *
 * @group unit/consumption/redshift-serverless-namespace
 */
describe('With default configuration, the construct', () => {

  const stack = new Stack();

  new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    dbName: 'defaultdb',
    name: 'defaultnamespace',
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('Should create 2 new encryption keys', () => {
    template.resourceCountIs('AWS::KMS::Key', 2);
  });

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
      namespaceName: Match.stringLikeRegexp('^defaultnamespace\-.+'),
    });
  });

  test('Should create a role for the custom resource', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      Policies: [
        {
          PolicyDocument: Match.objectLike({
            Statement: [
              {
                Action: [
                  'ssm:GetParameter',
                  'ssm:PutParameter',
                  'ssm:DeleteParameter',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      'arn:aws:ssm:',
                      Match.stringLikeRegexp('\:parameter/updateNamespace\-idx\-.*'),
                    ]),
                  ]),
                },
              },
              {
                Action: [
                  'redshift-serverless:CreateNamespace',
                  'redshift-serverless:GetNamespace',
                  'redshift-serverless:UpdateNamespace',
                  'redshift-serverless:DeleteNamespace',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      'arn:aws:redshift-serverless:',
                      {
                        Ref: 'AWS::Region',
                      },
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':namespace/*',
                    ]),
                  ]),
                },
              },
              {
                Action: [
                  'secretsmanager:CreateSecret',
                  'secretsmanager:TagResource',
                  'secretsmanager:DeleteSecret',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      'arn:aws:secretsmanager:',
                      {
                        Ref: 'AWS::Region',
                      },
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':secret:redshift!*',
                    ]),
                  ]),
                },
              },
              {
                Action: 'secretsmanager:RotateSecret',
                Condition: {
                  StringEquals: {
                    'aws:ResourceTag/aws:secretsmanager:owningService': 'redshift',
                  },
                },
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      'arn:aws:secretsmanager:',
                      {
                        Ref: 'AWS::Region',
                      },
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':secret:redshift!*',
                    ]),
                  ]),
                },
              },
              {
                Action: [
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                  'kms:CreateGrant',
                ],
                Effect: 'Allow',
                Resource: [
                  {
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('DefaultNamespaceDefaultNamespaceKey.*'),
                      'Arn',
                    ],
                  },
                  {
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('DefaultNamespaceDefaultManagedAdminPasswordKey.*'),
                      'Arn',
                    ],
                  },
                ],
              },
            ],
          }),
          PolicyName: 'PrimaryPermissions',
        },
      ],
    });
  });

  test('should create 2 lambda functions for the onEvent and isComplete', () => {
    template.resourcePropertiesCountIs('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('DefaultNamespaceManagementRole.*'),
          'Arn',
        ],
      },
      Timeout: 300,
    }, 2);
  });

  test('Should create Redshift serverless namespace', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
      namespaceName: 'defaultnamespace-8c88874e',
      managedAdminPasswordKeyId: {
        Ref: Match.stringLikeRegexp('DefaultNamespaceDefaultManagedAdminPasswordKey.*'),
      },
      adminUsername: 'admin',
      dbName: 'defaultdb',
      iamRoles: [],
      kmsKeyId: {
        Ref: Match.stringLikeRegexp('DefaultNamespaceDefaultNamespaceKey.*'),
      },
      manageAdminPassword: true,
      logExports: [],
      indexParameterName: Match.stringLikeRegexp('updateNamespace\-idx\-.*'),
    });
  });
});

describe('With custom configuration, the construct', () => {

  const stack = new Stack();

  const adminIAMRole = new Role(stack, 'AdminRole1', {
    assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    ],
  });

  const adminIAMRole2 = new Role(stack, 'AdminRole2', {
    assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    ],
  });

  const dataKey = new Key(stack, 'DataKey');
  const adminSecretKey = new Key(stack, 'AdminSecretKey');

  new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    dbName: 'defaultdb',
    name: 'defaultnamespace',
    defaultIAMRole: adminIAMRole,
    iamRoles: [
      adminIAMRole,
      adminIAMRole2,
    ],
    logExports: [
      RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
      RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
      RedshiftServerlessNamespaceLogExport.USER_LOG,
    ],
    dataKey,
    adminUsername: 'admin',
    adminSecretKey,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('Should create Redshift serverless namespace', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
      logExports: Match.arrayEquals([
        RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
        RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
        RedshiftServerlessNamespaceLogExport.USER_LOG,
      ]),
      namespaceName: Match.stringLikeRegexp('^defaultnamespace\-.+'),
      adminUsername: Match.exact('admin'),
      managedAdminPasswordKeyId: {
        Ref: Match.stringLikeRegexp('AdminSecretKey.*'),
      },
      manageAdminPassword: true,
      dbName: Match.exact('defaultdb'),
      defaultIamRoleArn: {
        'Fn::GetAtt': [Match.stringLikeRegexp('AdminRole1.*'), 'Arn'],
      },
      iamRoles: Match.arrayEquals([
        { 'Fn::GetAtt': [Match.stringLikeRegexp('AdminRole1.*'), 'Arn'] },
        { 'Fn::GetAtt': [Match.stringLikeRegexp('AdminRole2.*'), 'Arn'] },
      ]),
      kmsKeyId: {
        Ref: Match.stringLikeRegexp('DataKey.*'),
      },
    });
  });

  test('should create resources with RETAIN policy when global removal policy is unset', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('Custom::RedshiftServerlessNamespace', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('AWS::KMS::Key', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With global removal policy set to DELETE, the construct ', () => {

  const stack = new Stack();
  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    dbName: 'defaultdb',
    name: 'defaultnamespace',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create resources with DELETE policy when global removal policy is set to DELETE', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('Custom::RedshiftServerlessNamespace', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('AWS::KMS::Key', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});