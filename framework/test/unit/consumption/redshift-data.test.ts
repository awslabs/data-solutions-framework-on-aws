// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, SecretValue, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnNamespace, CfnWorkgroup } from 'aws-cdk-lib/aws-redshiftserverless';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RedshiftData } from '../../../src/consumption';

/**
 * Unit tests for RedshiftData construct
 *
 * @group unit/consumption/redshift-data
 */
describe('With default configuration, the construct ', () => {

  const redshiftDataStack = new Stack();

  const adminSecret = new Secret(redshiftDataStack, 'Secret', {
    secretObjectValue: {
      username: SecretValue.unsafePlainText('admin'),
      password: SecretValue.unsafePlainText('Test1234'),
    },
  });

  const cfnNamespace = new CfnNamespace(redshiftDataStack, 'TestCfnNamespace', {
    namespaceName: 'test',
    adminUsername: 'admin',
    adminUserPassword: 'Test1234',
  });
  const cfnWorkgroup = new CfnWorkgroup(redshiftDataStack, 'TestCfnWorkgroup', {
    workgroupName: 'test',
    namespaceName: cfnNamespace.attrNamespaceNamespaceName,
  });

  const dataApi = new RedshiftData(redshiftDataStack, 'RedshiftData', {
    workgroupId: cfnWorkgroup.attrWorkgroupWorkgroupId,
    secret: adminSecret,
  });

  const testRole = new Role(redshiftDataStack, 'TestRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  dataApi.runCustomSQL('TestCustom', 'dev', 'create schema testschema');

  dataApi.createDbRole('TestRole', 'dev', 'testrole');

  dataApi.grantDbSchemaToRole('TestRoleGrantTest', 'dev', 'test', 'testrole');

  dataApi.grantSchemaReadToRole('TestRoleGrantRead', 'dev', 'testschema', 'testrole');

  dataApi.assignDbRolesToIAMRole(['testrole'], testRole);

  dataApi.grantDbAllPrivilegesToRole('TestRoleGrantAll', 'dev', 'testschema', 'testrole');

  const sourceBucket = new Bucket(redshiftDataStack, 'SourceBucket');

  dataApi.ingestData('TestCopy', 'dev', 'testtable', sourceBucket, '');

  dataApi.mergeToTargetTable('TestMerge', 'dev', 'testsourcetable', 'testtargettable');

  const template = Template.fromStack(redshiftDataStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an IAM Role for the custom resource execution with Redshift Data API permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          }),
        ],
      }),
      ManagedPolicyArns: [
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            ]),
          ]),
        },
      ],
      Policies: [
        {
          PolicyDocument: Match.objectLike({
            Statement: [
              {
                Action: [
                  'redshift-data:BatchExecuteStatement',
                  'redshift-data:ExecuteStatement',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        'Fn::GetAtt': [
                          'TestCfnWorkgroup',
                          'Workgroup.WorkgroupId',
                        ],
                      },
                    ]),
                  ]),
                },
              },
              {
                Action: [
                  'redshift-data:DescribeStatement',
                  'redshift-data:CancelStatement',
                  'redshift-data:GetStatementResult',
                ],
                Effect: 'Allow',
                Resource: '*',
              },
            ],
          }),
          PolicyName: 'RedshiftDataPermission',
        },
      ],
    });
  });

  test('should create an IAM policy for the custom resource with Secrets permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Effect: 'Allow',
            Resource: {
              Ref: Match.anyValue(),
            },
          },
        ]),
      },
      Roles: [
        {
          Ref: Match.stringLikeRegexp('RedshiftDataExecutionRole.*'),
        },
      ],
    });
  });

  test('should create 2 lambda functions for the onEvent and isComplete', () => {
    template.resourcePropertiesCountIs('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('RedshiftDataExecutionRole.*'),
          'Arn',
        ],
      },
      Timeout: 300,
    }, 2);
  });

  test('should create a managed policy for tagging Roles', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: [
              'tag:GetResources',
              'tag:GetTagKeys',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });
  });

  test('should create custom resource for executing the custom SQL', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'create schema testschema',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for granting usage on schema to role', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'grant usage on schema test to role testrole',
      deleteSql: 'revoke usage on schema test from role testrole',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for executing creating the role', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'create role testrole',
      deleteSql: 'drop role testrole',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for granting read access to all tables', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'grant select on all tables in schema testschema to role testrole',
      deleteSql: 'revoke select on all tables in schema testschema from role testrole',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for granting al privilege to a role', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'grant all on all tables in schema testschema to role testrole',
      deleteSql: 'revoke all on all tables in schema testschema from role testrole',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for copy data', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: {
        'Fn::Join': Match.arrayWith([
          [
            "copy testtable from 's3://",
            {
              Ref: Match.stringLikeRegexp('SourceBucket.*'),
            },
            "/' iam_role default",
          ],
        ]),
      },
      databaseName: 'dev',
    });
  });

  test('should create custom resource for merge', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'merge into testtargettable using testsourcetable on testtargettable.id=testsourcetable.id remove duplicates',
      databaseName: 'dev',
    });
  });

});

describe('With custom configuration, the construct ', () => {

  const redshiftDataStack = new Stack();

  const vpc = new Vpc(redshiftDataStack, 'Vpc');

  const adminSecret = new Secret(redshiftDataStack, 'Secret', {
    secretObjectValue: {
      username: SecretValue.unsafePlainText('admin'),
      password: SecretValue.unsafePlainText('Test1234'),
    },
  });

  const cfnNamespace = new CfnNamespace(redshiftDataStack, 'TestCfnNamespace', {
    namespaceName: 'test',
    adminUsername: 'admin',
    adminUserPassword: 'Test1234',
  });
  const cfnWorkgroup = new CfnWorkgroup(redshiftDataStack, 'TestCfnWorkgroup', {
    workgroupName: 'test',
    namespaceName: cfnNamespace.attrNamespaceNamespaceName,
    subnetIds: vpc.selectSubnets().subnetIds,
    securityGroupIds: [vpc.vpcDefaultSecurityGroup],
  });

  const dataApi = new RedshiftData(redshiftDataStack, 'RedshiftData', {
    workgroupId: cfnWorkgroup.attrWorkgroupWorkgroupId,
    secret: adminSecret,
    vpc,
    subnets: vpc.selectSubnets(),
    createInterfaceVpcEndpoint: true,
    executionTimeout: Duration.seconds(600),
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const testRole = new Role(redshiftDataStack, 'TestRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  dataApi.runCustomSQL('TestCustom', 'dev', 'create schema testschema', 'delete schema testschema');

  const sourceBucket = new Bucket(redshiftDataStack, 'SourceBucket');

  dataApi.ingestData('TestCopy', 'dev', 'testtable', sourceBucket, 'test-prefix', 'additional options', testRole);

  dataApi.mergeToTargetTable('TestMerge', 'dev', 'testsourcetable', 'testtargettable', 'test_source_column', 'test_target_column');

  const template = Template.fromStack(redshiftDataStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an IAM Role for the custom resource execution with Redshift Data API permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          }),
        ],
      }),
      ManagedPolicyArns: [
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            ]),
          ]),
        },
        {
          Ref: Match.stringLikeRegexp('RedshiftDataCrProviderVpcPolicy.*'),
        },
      ],
      Policies: [
        {
          PolicyDocument: Match.objectLike({
            Statement: [
              {
                Action: [
                  'redshift-data:BatchExecuteStatement',
                  'redshift-data:ExecuteStatement',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        'Fn::GetAtt': [
                          'TestCfnWorkgroup',
                          'Workgroup.WorkgroupId',
                        ],
                      },
                    ]),
                  ]),
                },
              },
              {
                Action: [
                  'redshift-data:DescribeStatement',
                  'redshift-data:CancelStatement',
                  'redshift-data:GetStatementResult',
                ],
                Effect: 'Allow',
                Resource: '*',
              },
            ],
          }),
          PolicyName: 'RedshiftDataPermission',
        },
      ],
    });
  });

  test('should create an IAM policy for the custom resource with Secrets permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Effect: 'Allow',
            Resource: {
              Ref: Match.anyValue(),
            },
          },
        ]),
      },
      Roles: [
        {
          Ref: Match.stringLikeRegexp('RedshiftDataExecutionRole.*'),
        },
      ],
    });
  });

  test('should create 2 lambda functions for the onEvent and isComplete', () => {
    template.resourcePropertiesCountIs('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('RedshiftDataExecutionRole.*'),
          'Arn',
        ],
      },
      Timeout: 600,
    }, 2);
  });

  test('should create a managed policy for tagging Roles', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: [
              'tag:GetResources',
              'tag:GetTagKeys',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });
  });

  test('should create a DsfProvider with VPC access, which means a custom resource for cleanup', () => {
    template.hasResourceProperties('Custom::LambdaEniCleanup', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('RedshiftDataCrProviderCleanUpProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
    });
  });

  test('should create custom resource for executing the custom SQL', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'create schema testschema',
      deleteSql: 'delete schema testschema',
      databaseName: 'dev',
    });
  });

  test('should create custom resource for copy data', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: {
        'Fn::Join': Match.arrayWith([
          [
            "copy testtable from 's3://",
            {
              Ref: Match.stringLikeRegexp('SourceBucket.*'),
            },
            "/test-prefix' iam_role '",
            {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('TestRole.*'),
                'Arn',
              ],
            },
            "' additional options",
          ],
        ]),
      },
      databaseName: 'dev',
    });
  });

  test('should create custom resource for merge', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      ServiceToken: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('RedshiftDataCrProviderCustomResourceProviderframeworkonEvent.*'),
        ]),
      },
      sql: 'merge into testtargettable using testsourcetable on testtargettable.test_target_column=testsourcetable.test_source_column remove duplicates',
      databaseName: 'dev',
    });
  });

  test('should create resources with RETAIN policy when global removal policy is unset', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('Custom::RedshiftDataSql', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With global removal policy set and the construct removal policy to DESTROY, the construct should', () => {

  const redshiftDataStack = new Stack();

  // Set context value for global data removal policy
  redshiftDataStack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const vpc = new Vpc(redshiftDataStack, 'Vpc');

  const adminSecret = new Secret(redshiftDataStack, 'Secret', {
    secretObjectValue: {
      username: SecretValue.unsafePlainText('admin'),
      password: SecretValue.unsafePlainText('Test1234'),
    },
  });

  const cfnNamespace = new CfnNamespace(redshiftDataStack, 'TestCfnNamespace', {
    namespaceName: 'test',
    adminUsername: 'admin',
    adminUserPassword: 'Test1234',
  });
  const cfnWorkgroup = new CfnWorkgroup(redshiftDataStack, 'TestCfnWorkgroup', {
    workgroupName: 'test',
    namespaceName: cfnNamespace.attrNamespaceNamespaceName,
    subnetIds: vpc.selectSubnets().subnetIds,
    securityGroupIds: [vpc.vpcDefaultSecurityGroup],
  });

  const dataApi = new RedshiftData(redshiftDataStack, 'RedshiftData', {
    workgroupId: cfnWorkgroup.attrWorkgroupWorkgroupId,
    secret: adminSecret,
    vpc,
    subnets: vpc.selectSubnets(),
    createInterfaceVpcEndpoint: true,
    executionTimeout: Duration.seconds(600),
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const testRole = new Role(redshiftDataStack, 'TestRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  });

  dataApi.runCustomSQL('TestCustom', 'dev', 'create schema testschema');

  dataApi.createDbRole('TestRole', 'dev', 'testrole');

  dataApi.grantDbSchemaToRole('TestRoleGrantTest', 'dev', 'test', 'testrole');

  dataApi.grantSchemaReadToRole('TestRoleGrantRead', 'dev', 'testschema', 'testrole');

  dataApi.assignDbRolesToIAMRole(['testrole'], testRole);

  dataApi.grantDbAllPrivilegesToRole('TestRoleGrantAll', 'dev', 'testschema', 'testrole');

  const sourceBucket = new Bucket(redshiftDataStack, 'SourceBucket');

  dataApi.ingestData('TestCopy', 'dev', 'testtable', sourceBucket, '');

  dataApi.mergeToTargetTable('TestMerge', 'dev', 'testsourcetable', 'testtargettable');

  const template = Template.fromStack(redshiftDataStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test(' create resources with Delete policy', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('Custom::RedshiftDataSql', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('Custom::LambdaEniCleanup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});