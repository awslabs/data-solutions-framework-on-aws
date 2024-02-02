// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { RedshiftServerlessWorkgroup } from '../../../src/consumption';

/**
 * Tests RedshiftServerlessWorkgroup construct
 *
 * @group unit/consumption/redshift-serverless-workgroup
 */
describe('Create Workgroup with a default namespace and VPC', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
    workgroupName: 'dsf-rs-test',
  });

  const template = Template.fromStack(stack);

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      namespaceName: Match.stringLikeRegexp('^default\-.+'),
    });
  });

  test('Has workgroup', () => {
    template.hasResourceProperties('AWS::RedshiftServerless::Workgroup', {
      EnhancedVpcRouting: Match.exact(true),
      NamespaceName: Match.stringLikeRegexp('^default\-.+'),
      PubliclyAccessible: Match.exact(false),
      SubnetIds: Match.arrayEquals([
        { Ref: Match.stringLikeRegexp('^RedshiftWorkgroupVpcPrivateSubnet1Subnet.+') },
        { Ref: Match.stringLikeRegexp('^RedshiftWorkgroupVpcPrivateSubnet2Subnet.+') },
      ]),
      SecurityGroupIds: Match.arrayEquals([
        { 'Fn::GetAtt': [Match.stringLikeRegexp('^RedshiftWorkgroupRSServerlessPrimarySG.+'), 'GroupId'] },
      ]),
    });
  });

  test('Has default VPC', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: Match.exact('10.0.0.0/16'),
    });
  });
});


describe('Create Workgroup with a default namespace and non-default VPC', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

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

  const bucket = new Bucket(stack, 'ExampleBucket', {
    bucketName: 'examplebucket',
  });

  const adminIAMRole = new Role(stack, 'RSAdminRole', {
    assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    ],
  });

  const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
    vpc,
    subnets: {
      subnetGroupName: 'private-dwh',
    },
    workgroupName: 'dsf-rs-test',
  });

  const accessData = workgroup.accessData();
  accessData.createDbRole('defaultdb', 'engineering');
  accessData.grantDbSchemaToRole('defaultdb', 'public', 'engineering');
  accessData.grantDbReadToRole('defaultdb', 'public', 'engineering');
  accessData.assignDbRolesToIAMRole(['engineering'], adminIAMRole);

  accessData.ingestData('defaultdb', 'exampletable', bucket, 'exampletable/', 'csv ignoreheader 1');
  accessData.mergeToTargetTable('defaultdb', 'exampletable', 'targettable');

  workgroup.catalogTables('rs-defaultdb');

  const template = Template.fromStack(stack);

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      namespaceName: Match.stringLikeRegexp('^default\-.+'),
    });
  });

  test('Has workgroup', () => {
    template.hasResourceProperties('AWS::RedshiftServerless::Workgroup', {
      EnhancedVpcRouting: Match.exact(true),
      NamespaceName: Match.stringLikeRegexp('^default\-.+'),
      PubliclyAccessible: Match.exact(false),
      SubnetIds: Match.arrayEquals([
        { Ref: Match.stringLikeRegexp('^rsexamplenetworkprivatedwhSubnet1Subnet.+') },
        { Ref: Match.stringLikeRegexp('^rsexamplenetworkprivatedwhSubnet2Subnet.+') },
      ]),
      SecurityGroupIds: Match.arrayEquals([
        { 'Fn::GetAtt': [Match.stringLikeRegexp('^RedshiftWorkgroupRSServerlessPrimarySG.+'), 'GroupId'] },
      ]),
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
                { 'Fn::GetAtt': [Match.stringLikeRegexp('^RedshiftWorkgroupRSServerlessWorkgroup.+'), 'Workgroup.Endpoint.Address'] },
                Match.exact(':5439/defaultdb'),
              ]),
            ]),
          },
          SECRET_ID: Match.anyValue(),
        },
        ConnectionType: Match.exact('JDBC'),
      },
    });
  });

  test('Has creation of DB resources', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      sql: Match.exact('create role engineering'),
      deleteSql: Match.exact('drop role engineering'),
      databaseName: Match.exact('defaultdb'),
    });

    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      sql: Match.exact('grant usage on schema public to role engineering'),
      deleteSql: Match.exact('revoke usage on schema public from role engineering'),
      databaseName: Match.exact('defaultdb'),
    });

    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      sql: Match.exact('grant select on all tables in schema public to role engineering'),
      deleteSql: Match.exact('revoke select on all tables in schema public from role engineering'),
      databaseName: Match.exact('defaultdb'),
    });

    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      sql: {
        'Fn::Join': Match.arrayEquals([
          Match.exact(''),
          Match.arrayEquals([
            "copy exampletable from \'s3://",
            { Ref: Match.stringLikeRegexp('^ExampleBucket.+') },
            "/exampletable/\' iam_role default csv ignoreheader 1",
          ]),
        ]),
      },
      databaseName: Match.exact('defaultdb'),
    });

    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      sql: Match.exact('merge into targettable using exampletable on targettable.id=exampletable.id remove duplicates'),
      databaseName: Match.exact('defaultdb'),
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      Tags: Match.arrayWith([
        { Key: Match.exact('RedshiftDbRoles'), Value: Match.exact('engineering') },
      ]),
    });
  });

  test('Has catalog database and crawler', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: Match.stringLikeRegexp('^rs-defaultdb.+'),
      },
    });

    template.hasResourceProperties('AWS::Glue::Crawler', {
      DatabaseName: Match.stringLikeRegexp('^rs-defaultdb.+'),
      Name: Match.stringLikeRegexp('^rs-defaultdb.+?\-crawler$'),
      Targets: {
        JdbcTargets: Match.arrayWith([
          {
            ConnectionName: Match.stringLikeRegexp('^glue\-conn\-dsf\-rs\-test.+'),
            Path: Match.exact('defaultdb/public/%'),
          },
        ]),
      },
    });
  });
});