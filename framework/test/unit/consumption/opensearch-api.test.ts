// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests for OpenSearch cluster API construct
 * @group unit/consumption/opensearch-api
 */


import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Role } from 'aws-cdk-lib/aws-iam';
import { OpenSearchApi, OpenSearchCluster, OpenSearchClusterType } from '../../../src/consumption';


describe('default configuration', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate AccessLogsBucket Construct with default
  const osCluster = new OpenSearchCluster(stack, 'OpenSearchTestApi', {
    domainName: 'mycluster2',
    samlEntityId: '<idpTest>',
    samlMetadataContent: 'xmlContent',
    samlMasterBackendRole: 'IdpGroupId',
    deployInVpc: false,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  osCluster.addRoleMapping('role1', 'user1', 'group1');
  const template = Template.fromStack(stack);

  test('should have OpenSearch domain', () => {
    template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
  });

  test('creates opensearch api client', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 840,
      Tags: Match.arrayWith([
        {
          Key: 'data-solutions-fwk:owned',
          Value: 'true',
        },
      ]),
    });
  });

});

describe('standalone api initialization', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  // Instantiate OpenSearchCluster with standalone API
  const domainEndpoint='search-XXXXXX.XXXXXX.es.amazonaws.com';
  const apiRole = Role.fromRoleName(stack, 'ApiRole', 'IAMRoleWithOpenSearchPermissions');
  const osApi = new OpenSearchApi(stack, 'MyOpenSearchApi', {
    iamHandlerRole: apiRole,
    openSearchEndpoint: domainEndpoint,
    openSearchClusterType: OpenSearchClusterType.PROVISIONED,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  //Add another admin
  osApi.addRoleMapping('AnotherAdmin', 'all_access', 'sometestId');

  const template = Template.fromStack(stack);


  test('should create opensearch api lambda', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 840,
      Tags: Match.arrayWith([
        {
          Key: 'data-solutions-fwk:owned',
          Value: 'true',
        },
      ]),
    });
  });

  test('should create the API provider', () => {
    template.hasResourceProperties('Custom::OpenSearchAPI', {
      ServiceToken: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('MyOpenSearchApiProviderCustomResourceProviderframeworkonEvent.*'),
          'Arn',
        ],
      },
    });
  });
});

