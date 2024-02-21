// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests for OpenSearch cluster construct
 * @group unit/consumption/opensearch
 */


import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { OpensearchCluster } from '../../../src/consumption';


describe('default configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new OpensearchCluster(stack, 'OpensearchVpc', {
    domainName: 'mycluster2',
    samlEntityId: '<idpTest>',
    samlMetadataContent: 'xmlContent',
    samlMasterBackendRole: 'IdpGroupId',
    deployInVpc: true,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should have OpenSearch domain', () => {
    template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
  });

  test('creates log group with tags', () => {

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: 'opensearch-domain-logs-mycluster2',
      RetentionInDays: 731,
      Tags: Match.arrayWith([
        {
          Key: 'data-solutions-fwk:owned',
          Value: 'true',
        },
      ]),
    });
  });

  test( 'should have domain settings', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      ClusterConfig: {
        DedicatedMasterCount: 3,
        DedicatedMasterEnabled: true,
        DedicatedMasterType: 'm6g.large.search',
        InstanceType: 'r6g.xlarge.search',
        MultiAZWithStandbyEnabled: false,
        ZoneAwarenessEnabled: true,
      },
      DomainEndpointOptions: {
        EnforceHTTPS: true,
        TLSSecurityPolicy: 'Policy-Min-TLS-1-0-2019-07',
      },
      DomainName: 'mycluster2',
      EBSOptions: {
        EBSEnabled: true,
        VolumeSize: 10,
        VolumeType: 'gp3',
      },
      EncryptionAtRestOptions: {
        Enabled: true,
      },
      EngineVersion: 'OpenSearch_2.9',
      AdvancedSecurityOptions: {
        Enabled: true,
        InternalUserDatabaseEnabled: false,
        SAMLOptions: {
          Enabled: true,
          Idp: {
            EntityId: '<idpTest>',
            MetadataContent: 'xmlContent',
          },
          RolesKey: 'Role',
          SessionTimeoutMinutes: 480,
          MasterBackendRole: 'IdpGroupId',
        },
      },
    });
  });
});

describe('non vpc config', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new OpensearchCluster(stack, 'OpensearchPublic', {
    domainName: 'mycluster2-public',
    samlEntityId: '<idpTest>',
    samlMetadataContent: 'xmlContent',
    samlMasterBackendRole: 'IdpGroupId',
    deployInVpc: false,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should have opensearch domain', () => {
    template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
  });
  test('should have domain settings', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      ClusterConfig: {
        DedicatedMasterCount: 3,
        DedicatedMasterEnabled: true,
        DedicatedMasterType: 'm6g.large.search',
        InstanceType: 'r6g.xlarge.search',
        MultiAZWithStandbyEnabled: false,
        ZoneAwarenessEnabled: true,
      },
      DomainEndpointOptions: {
        EnforceHTTPS: true,
        TLSSecurityPolicy: 'Policy-Min-TLS-1-0-2019-07',
      },
      DomainName: 'mycluster2-public',
      EBSOptions: {
        EBSEnabled: true,
        VolumeSize: 10,
        VolumeType: 'gp3',
      },
      EncryptionAtRestOptions: {
        Enabled: true,
      },
      EngineVersion: 'OpenSearch_2.9',
      AdvancedSecurityOptions: {
        Enabled: true,
        InternalUserDatabaseEnabled: false,
        SAMLOptions: {
          Enabled: true,
          Idp: {
            EntityId: '<idpTest>',
            MetadataContent: 'xmlContent',
          },
          RolesKey: 'Role',
          SessionTimeoutMinutes: 480,
          MasterBackendRole: 'IdpGroupId',
        },
      },
    });
  });
  test('should not have vpc config', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      VPCOptions: Match.absent(),
    });
  });
});