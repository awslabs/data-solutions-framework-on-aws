// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from '../../../src/consumption';

/**
 * Unit tests for RedshiftDataSharing construct
 *
 * @group unit/consumption/redshift-data-sharing
 */
describe('With a local based data sharing, the construct ', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack', {
    env: { account: '111111111111', region: 'us-east-1' },
  });
  const vpc = new Vpc(stack, 'Vpc', {
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
  });

  const namespace2 = new RedshiftServerlessNamespace(stack, 'DefaultNamespace2', {
    name: 'default',
    dbName: 'defaultdb',
  });

  const workgroup2 = new RedshiftServerlessWorkgroup(stack, 'RedshiftWorkgroup2', {
    vpc,
    subnets: {
      subnetGroupName: 'private-dwh',
    },
    name: 'dsf-rs-test',
    namespace: namespace2,
    baseCapacity: 8,
    removalPolicy: RemovalPolicy.DESTROY,
    port: 9999,
  });

  const dataSharing = workgroup.dataSharing('data-sharing', true);
  const dataSharing2 = workgroup2.dataSharing('data-sharing2', true);
  dataSharing.createShare('NewShare', 'defaultdb', 'demoshare', 'sample', ['sample.customer', 'sample.inventory']);
  dataSharing.grant('GrantDemo1', {
    databaseName: 'defaultdb',
    dataShareName: 'demoshare',
    namespaceId: '1234567890',
  });

  dataSharing2.createDatabaseFromShare('CreateDbFromShare', {
    databaseName: 'defaultdb',
    dataShareName: 'demoshare',
    newDatabaseName: 'shared_db',
    namespaceId: namespace.namespaceId,
  });

  const template = Template.fromStack(stack);
  test('should create a custom resource to manage new data share', () => {
    template.hasResourceProperties('Custom::RedshiftDataShare', {
      databaseName: Match.exact('defaultdb'),
      dataShareName: Match.exact('demoshare'),
      schema: Match.exact('sample'),
      tables: Match.exact([
        'sample.customer',
        'sample.inventory',
      ]),
    });
  });

  test('should use RedshiftData construct to run the grant', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      sql: Match.exact("grant usage on datashare demoshare to namespace '1234567890'"),
      deleteSql: Match.exact("revoke usage on datashare demoshare from namespace '1234567890'"),
      databaseName: Match.exact('defaultdb'),
    });
  });

  test('should use RedshiftData construct to run the create database from datashare', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      sql: {
        'Fn::Join': Match.exact([
          '',
          [
            Match.exact("create database shared_db from datashare demoshare of namespace '"),
            Match.exact({
              'Fn::GetAtt': [
                'DefaultNamespaceCustomResource6A9A16E8',
                'namespaceId',
              ],
            }),
            "'",
          ],
        ]),
      },
      deleteSql: Match.exact('drop database shared_db'),
      databaseName: Match.exact('defaultdb'),
    });
  });
});

describe('With cross account sharing, the construct ', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack1', {
    env: { account: '111111111111', region: 'us-east-1' },
  });

  const stack2 = new Stack(app, 'Stack2', {
    env: { account: '222222222222', region: 'us-east-1' },
  });

  const vpc = new Vpc(stack, 'Vpc', {
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

  const vpc2 = new Vpc(stack2, 'Vpc2', {
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
  });

  const namespace2 = new RedshiftServerlessNamespace(stack2, 'DefaultNamespace2', {
    name: 'default',
    dbName: 'defaultdb',
  });

  const workgroup2 = new RedshiftServerlessWorkgroup(stack2, 'RedshiftWorkgroup2', {
    vpc: vpc2,
    subnets: {
      subnetGroupName: 'private-dwh',
    },
    name: 'dsf-rs-test',
    namespace: namespace2,
    baseCapacity: 8,
    removalPolicy: RemovalPolicy.DESTROY,
    port: 9999,
  });

  const dataSharing = workgroup.dataSharing('data-sharing', true);
  const dataSharing2 = workgroup2.dataSharing('data-sharing2', true);

  const newShare = dataSharing.createShare('NewShare', 'defaultdb', 'demoshare', 'sample', ['sample.customer', 'sample.inventory']);
  dataSharing.grant('GrantDemo1', {
    databaseName: 'defaultdb',
    dataShareName: 'demoshare',
    accountId: '222222222222',
    autoAuthorized: true,
    dataShareArn: newShare.getAttString('dataShareArn'),
  });

  dataSharing2.createDatabaseFromShare('CreateDbFromShare', {
    databaseName: 'defaultdb',
    dataShareName: 'demoshare',
    newDatabaseName: 'shared_db',
    namespaceId: '1234-5678-9012',
    accountId: '111111111111',
    consumerNamespaceArn: namespace2.namespaceArn,
    dataShareArn: 'example-data-share-arn',
  });

  const template = Template.fromStack(stack);
  const template2 = Template.fromStack(stack2);

  test('should create a custom resource to manage new data share', () => {
    template.hasResourceProperties('Custom::RedshiftDataShare', {
      databaseName: Match.exact('defaultdb'),
      dataShareName: Match.exact('demoshare'),
      schema: Match.exact('sample'),
      tables: Match.exact([
        'sample.customer',
        'sample.inventory',
      ]),
    });
  });

  test('should create a cross account grant', () => {
    template.hasResourceProperties('Custom::RedshiftDataSql', {
      sql: Match.exact("grant usage on datashare demoshare to account '222222222222'"),
      deleteSql: Match.exact("revoke usage on datashare demoshare from account '222222222222'"),
      databaseName: Match.exact('defaultdb'),
    });
  });

  test('should authorize data share', () => {
    template.hasResourceProperties('Custom::AWS', {
      Create: Match.exact({
        'Fn::Join': [
          '',
          [
            '{"service":"redshift","action":"authorizeDataShare","parameters":{"DataShareArn":"',
            {
              'Fn::GetAtt': [
                'RedshiftWorkgroupdatasharingNewShare90550BC0',
                'dataShareArn',
              ],
            },
            '","ConsumerIdentifier":"222222222222"},"physicalResourceId":{"id":"AuthorizeDataShare-222222222222-',
            {
              'Fn::GetAtt': [
                'RedshiftWorkgroupdatasharingNewShare90550BC0',
                'dataShareArn',
              ],
            },
            '"}}',
          ],
        ],
      }),
      Delete: Match.exact({
        'Fn::Join': [
          '',
          [
            '{"service":"redshift","action":"deauthorizeDataShare","parameters":{"DataShareArn":"',
            {
              'Fn::GetAtt': [
                'RedshiftWorkgroupdatasharingNewShare90550BC0',
                'dataShareArn',
              ],
            },
            '","ConsumerIdentifier":"222222222222"}}',
          ],
        ],
      }),
    });
  });

  test('should associate datashare in account 2', () => {
    template2.hasResourceProperties('Custom::AWS', {
      Create: Match.exact({
        'Fn::Join': [
          '',
          [
            '{"service":"redshift","action":"associateDataShareConsumer","parameters":{"DataShareArn":"example-data-share-arn","AssociateEntireAccount":false,"ConsumerArn":"',
            {
              'Fn::GetAtt': [
                'DefaultNamespace2CustomResource2C17213D',
                'namespaceArn',
              ],
            },
            '"},"physicalResourceId":{"id":"AssocDataShareConsumer-111111111111-1234-5678-9012"}}',
          ],
        ],
      }),
      Delete: Match.exact({
        'Fn::Join': [
          '',
          [
            '{"service":"redshift","action":"disassociateDataShareConsumer","parameters":{"DataShareArn":"example-data-share-arn","ConsumerArn":"',
            {
              'Fn::GetAtt': [
                'DefaultNamespace2CustomResource2C17213D',
                'namespaceArn',
              ],
            },
            '","DisassociateEntireAccount":false}}',
          ],
        ],
      }),
    });
  });

  test('should create new database from data share', () => {
    template2.hasResourceProperties('Custom::RedshiftDataSql', {
      sql: Match.exact("create database shared_db from datashare demoshare of account '111111111111' namespace '1234-5678-9012'"),
      deleteSql: Match.exact('drop database shared_db'),
      databaseName: Match.exact('defaultdb'),
    });
  });
});