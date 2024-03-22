// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests for OpenSearch cluster construct
 * @group unit/consumption/opensearch
 */


import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { DataVpc } from '../../../lib/utils';
import { OpenSearchCluster } from '../../../src/consumption';


describe('default configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new OpenSearchCluster(stack, 'OpenSearchVpc', {
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

  test( 'should have domain settings with SAML disabled by default', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      ClusterConfig: {
        DedicatedMasterEnabled: false,
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
      EngineVersion: 'OpenSearch_2.11',
      AdvancedSecurityOptions: {
        Enabled: true,
        InternalUserDatabaseEnabled: false,
      },
      VPCOptions: Match.objectLike({
        SubnetIds: [
          { Ref: Match.stringLikeRegexp('OpenSearchVpcPrivateSubnet1Subnet.*') },
          { Ref: Match.stringLikeRegexp('OpenSearchVpcPrivateSubnet2Subnet.*') },
        ],
      }),
    });
  });
});

describe('non vpc config', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  new OpenSearchCluster(stack, 'OpenSearchPublic', {
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
  test('should have domain settings with saml disabled', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      ClusterConfig: {
        DedicatedMasterEnabled: false,
        InstanceCount: 1,
        InstanceType: 'r6g.xlarge.search',
        MultiAZWithStandbyEnabled: false,
        ZoneAwarenessEnabled: false,
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
      EngineVersion: 'OpenSearch_2.11',
      AdvancedSecurityOptions: {
        Enabled: true,
        InternalUserDatabaseEnabled: false,
      },
    });
  });
  test('should not have vpc config', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      VPCOptions: Match.absent(),
    });
  });
});


describe('custom vpc configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const vpc = new DataVpc(stack, 'OpenSearchDataVpc', {
    vpcCidr: '10.0.0.0/16',
    clientVpnEndpointProps: {
      serverCertificateArn: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      samlMetadataDocument: 'samlMetadataDocument',
    },
  });

  const subnets = vpc.vpc.selectSubnets({ onePerAz: true, subnetType: SubnetType.PRIVATE_WITH_EGRESS }).subnets;
  const vpcSubnetsSelection = vpc.vpc.selectSubnets({ subnets: [subnets[0]] });

  new OpenSearchCluster(stack, 'OpenSearchDomainVpc', {
    domainName: 'mycluster2',
    samlEntityId: '<idpTest>',
    samlMetadataContent: 'xmlContent',
    samlMasterBackendRole: 'IdpGroupId',
    deployInVpc: true,
    vpc: vpc.vpc,
    vpcSubnets: vpcSubnetsSelection,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should have OpenSearch domain', () => {
    template.hasResourceProperties('AWS::OpenSearchService::Domain', {
      ClusterConfig: {
        DedicatedMasterEnabled: false,
        InstanceType: 'r6g.xlarge.search',
        MultiAZWithStandbyEnabled: false,
        ZoneAwarenessEnabled: false,
      },
      VPCOptions: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('OpenSearchDomainVpcSecurityGroup.*'),
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          {
            Ref: 'VpcPrivateSubnet1Subnet536B997A',
          },
        ],
      },
    });
  });

});
