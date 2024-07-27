// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests for OpenSearch cluster API construct
 * @group unit/consumption/opensearch-api
 */


import { Stack, App, RemovalPolicy } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { OpenSearchCluster } from '../../../src/consumption';


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

