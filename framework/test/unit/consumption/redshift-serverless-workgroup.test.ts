// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
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
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
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

  const workgroup = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup', {
    vpc,
    subnets: {
      subnetGroupName: 'private-dwh',
    },
    workgroupName: 'dsf-rs-test',
  });

  workgroup.accessData();

  workgroup.catalogTables('rs-defaultdb');

  const template = Template.fromStack(stack);

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
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