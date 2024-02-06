// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IpAddresses, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from '../../../src/consumption';

/**
 * Tests RedshiftServerlessWorkgroup construct
 *
 * @group unit/consumption/redshift-serverless-workgroup
 */
describe('With default configuration, the construct should', () => {

  const stack = new Stack();

  const namespace = new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    name: 'default',
    dbName: 'defaultdb',
  });

  const workgroup = new RedshiftServerlessWorkgroup(stack, 'DefaultWorkgroup', {
    name: 'dsf-rs-test',
    namespace,
  });

  workgroup.accessData('DataApi');
  workgroup.catalogTables('CatalogTables', 'default_test_db');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('Create a DataVpc with corresponding resources', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'vpc-logs-key',
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('DefaultWorkgroupFlowLogRoleDefaultPolicy.*'),
    });

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        {
          Key: 'Name',
          Value: 'Default/DefaultWorkgroup/Vpc',
        },
      ]),
    });
  });

  test('Create a default security group for the workgroup', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Default/DefaultWorkgroup/DefaultSecurityGroup',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1',
        },
      ],
      VpcId: {
        Ref: Match.stringLikeRegexp('DefaultWorkgroupVpc.*'),
      },
    });
  });

  test('Create security group rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 0,
      GroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('DefaultWorkgroupDefaultSecurityGroup.*'),
          'GroupId',
        ],
      },
      IpProtocol: 'tcp',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('DefaultWorkgroupDefaultSecurityGroup.*'),
          'GroupId',
        ],
      },
      ToPort: 65535,
    });
  });

  test('create the Redshift serverless workgroup', () => {
    template.hasResourceProperties('AWS::RedshiftServerless::Workgroup', {
      EnhancedVpcRouting: Match.exact(true),
      NamespaceName: Match.stringLikeRegexp('^default\-.+'),
      Port: 5439,
      PubliclyAccessible: Match.exact(false),
      SubnetIds: Match.arrayEquals([
        { Ref: Match.stringLikeRegexp('^DefaultWorkgroupVpcPrivateSubnet1Subnet.+') },
        { Ref: Match.stringLikeRegexp('^DefaultWorkgroupVpcPrivateSubnet2Subnet.+') },
      ]),
      SecurityGroupIds: Match.arrayEquals([
        { 'Fn::GetAtt': [Match.stringLikeRegexp('^DefaultWorkgroupDefaultSecurityGroup.+'), 'GroupId'] },
      ]),
      WorkgroupName: Match.stringLikeRegexp('dsf-rs-test.*'),
    });
  });

  test('create a Glue crawler for creating the database in Glue catalog', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('DefaultWorkgroupCatalogTablesCrawlerRoleDefaultPolicy.*'),
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'glue.amazonaws.com',
            },
          },
        ],
      }),
    });

    template.hasResourceProperties('AWS::Glue::Database', {
      CatalogId: {
        Ref: 'AWS::AccountId',
      },
      DatabaseInput: {
        Name: 'default_test_db_f6328146',
      },
    });
  });

  test('create the Redshift Redshift Data API custom resource', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: [
        {
          Ref: Match.stringLikeRegexp('DefaultWorkgroupDataApiCrProviderVpcPolicy.*'),
        },
      ],
    });
  });

  test('create the Glue connection', () => {
    template.hasResourceProperties('AWS::Glue::Connection', {
      CatalogId: {
        Ref: 'AWS::AccountId',
      },
      ConnectionInput: {
        ConnectionProperties: {
          JDBC_CONNECTION_URL: {
            'Fn::Join': Match.arrayWith([
              [
                'jdbc:redshift://',
                {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('DefaultWorkgroup.*'),
                    'Workgroup.Endpoint.Address',
                  ],
                },
                ':5439/defaultdb',
              ],
            ]),
          },
          SECRET_ID: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('DefaultNamespaceCustomResource.*'),
              'adminPasswordSecretArn',
            ],
          },
        },
        ConnectionType: 'JDBC',
        Name: Match.stringLikeRegexp('glue-conn-dsf-rs-test.*'),
        PhysicalConnectionRequirements: {
          AvailabilityZone: {
            'Fn::Select': [
              0,
              {
                'Fn::GetAZs': '',
              },
            ],
          },
          SecurityGroupIdList: [
            {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DefaultWorkgroupDefaultSecurityGroup.*'),
                'GroupId',
              ],
            },
          ],
          SubnetId: {
            Ref: Match.stringLikeRegexp('DefaultWorkgroupVpcPrivateSubnet1Subnet.*'),
          },
        },
      },
    });
  });
});


describe('With custom configuration and global removal policy unset, the construct should', () => {
  const stack = new Stack();

  const vpc = new Vpc(stack, 'rs-example-network', {
    ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
    enableDnsHostnames: true,
    enableDnsSupport: true,
    subnetConfiguration: [
      {
        name: 'private-dwh',
        subnetType: SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24,
      },
    ],
  });

  const namespace = new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    name: 'default',
    dbName: 'defaultdb',
  });

  const extraSecurityGroups = [new SecurityGroup(stack, 'ExtraSecurityGroup', {
    vpc,
  })];

  const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
    vpc,
    subnets: {
      subnetGroupName: 'private-dwh',
    },
    name: 'dsf-rs-test',
    namespace,
    baseCapacity: 8,
    removalPolicy: RemovalPolicy.DESTROY,
    port: 9999,
    extraSecurityGroups,
  });

  workgroup.accessData('DataApi', true);

  workgroup.catalogTables('DefaultDbCatalog', 'redshift_default_db', 'defaultdb/public/test%');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
      namespaceName: Match.stringLikeRegexp('^default\-.+'),
    });
  });

  test('create a workgroup with removal policy to RETAIN', () => {
    template.hasResource('AWS::RedshiftServerless::Workgroup', {
      Properties: {
        EnhancedVpcRouting: Match.exact(true),
        NamespaceName: Match.stringLikeRegexp('^default\-.+'),
        PubliclyAccessible: Match.exact(false),
        SubnetIds: Match.arrayEquals([
          { Ref: Match.stringLikeRegexp('^rsexamplenetworkprivatedwhSubnet1Subnet.+') },
          { Ref: Match.stringLikeRegexp('^rsexamplenetworkprivatedwhSubnet2Subnet.+') },
        ]),
        SecurityGroupIds: Match.arrayEquals([
          { 'Fn::GetAtt': [Match.stringLikeRegexp('^ExtraSecurityGroup.+'), 'GroupId'] },
          { 'Fn::GetAtt': [Match.stringLikeRegexp('^RedshiftWorkgroupDefaultSecurityGroup.+'), 'GroupId'] },
        ]),
      },
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('Has data access custom resource', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: Match.exact('index.onEventHandler'),
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: Match.exact('index.isCompleteHandler'),
    });
  });

  test('Has Glue Connection', () => {
    template.hasResourceProperties('AWS::Glue::Connection', {
      ConnectionInput: {
        ConnectionProperties: {
          JDBC_CONNECTION_URL: {
            'Fn::Join': Match.arrayEquals([
              Match.exact(''),
              Match.arrayEquals([
                Match.exact('jdbc:redshift://'),
                { 'Fn::GetAtt': [Match.stringLikeRegexp('^RedshiftWorkgroup.+'), 'Workgroup.Endpoint.Address'] },
                Match.exact(':9999/defaultdb'),
              ]),
            ]),
          },
          SECRET_ID: Match.anyValue(),
        },
        ConnectionType: Match.exact('JDBC'),
      },
    });
  });

  test('Has catalog database and crawler', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp('^redshift_default_db.+'),
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: Match.stringLikeRegexp('^redshift_default_db.+'),
      Name: Match.stringLikeRegexp('^redshift_default_db.+?\-crawler$'),
      Targets: {
        JdbcTargets: Match.arrayWith([
          {
            ConnectionName: Match.stringLikeRegexp('^glue\-conn\-dsf\-rs\-test.+'),
            Path: Match.exact('defaultdb/public/test%'),
          },
        ]),
      },
    });
  });

  test('should create resources with RETAIN policy when global removal policy is unset', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('AWS::Glue::Connection', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('AWS::KMS::Key', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });

    template.allResources('AWS::RedshiftServerless::Workgroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With custom configuration and removal policy set to DESTROY, the construct should', () => {

  const stack = new Stack();
  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const namespace = new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    name: 'default',
    dbName: 'defaultdb',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const workgroup = new RedshiftServerlessWorkgroup(stack, 'DefaultWorkgroup', {
    name: 'dsf-rs-test',
    namespace,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  workgroup.accessData('DataApi');
  workgroup.catalogTables('CatalogTables', 'default_test_db');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create resources with DELETE policy', () => {
    template.allResources('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('AWS::Glue::Connection', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('AWS::KMS::Key', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });

    template.allResources('AWS::RedshiftServerless::Workgroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});