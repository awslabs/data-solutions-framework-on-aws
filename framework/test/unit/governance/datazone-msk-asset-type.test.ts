// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataZoneMskAssetType construct
 *
 * @group unit/datazone/datazone-msk-asset-type
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataZoneMskAssetType } from '../../../src/governance';


describe ('Creating a DataZoneMskAssetType with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneMskAssetType(stack, 'DataZoneMskAssetType', {
    domainId: DOMAIN_ID,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('should create a default DataZoneCustomAssetFactory', () => {
    template.resourceCountIs('AWS::Lambda::Function', 3);
    template.resourceCountIs('AWS::IAM::Role', 3);
    template.resourceCountIs('AWS::IAM::Policy', 3);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.resourceCountIs('AWS::Lambda::Permission', 1);
  });

  test('should create a default DataZone project', () => {
    template.hasResourceProperties('AWS::DataZone::Project',
      Match.objectLike({
        DomainIdentifier: DOMAIN_ID,
        Name: 'MskGovernance',
      }),
    );
  });

  test('should create a default DataZone project membership', () => {
    template.hasResourceProperties('AWS::DataZone::ProjectMembership',
      Match.objectLike({
        Designation: 'PROJECT_OWNER',
        DomainIdentifier: DOMAIN_ID,
        Member: {
          UserIdentifier: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('DataZoneMskAssetTypeDZCustomAssetTypeHandlerHandlerRole.*'),
              'Arn',
            ],
          },
        },
        ProjectIdentifier: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneMskAssetTypeMskAssetTypeProjectOwner.*'),
            'Id',
          ],
        },
      }),
    );
  });

  test('should create a custom resource for the MSK topic asset type', () => {
    template.hasResourceProperties('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        ServiceToken: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneMskAssetTypeDZCustomAssetTypeHandlerProviderCustomResourceProviderframeworkonEvent.*'),
            'Arn',
          ],
        },
        domainId: DOMAIN_ID,
        projectId: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneMskAssetTypeMskAssetTypeProjectOwner.*'),
            'Id',
          ],
        },
        formTypes: [
          {
            name: 'amazon.datazone.RelationalTableFormType',
            required: true,
          },
          {
            name: 'MskSourceReferenceFormType',
            model: '\n        structure MskSourceReferenceFormType {\n          @required\ncluster_arn: String\n@required\ncluster_type: String\n        }\n      ',
            required: true,
          },
          {
            name: 'KafkaSchemaFormType',
            model: '\n        structure KafkaSchemaFormType {\n          @required\nkafka_topic: String\n\nschema_version: Integer\n\nschema_arn: String\n\nregistry_arn: String\n        }\n      ',
            required: true,
          },
        ],
        assetTypeName: 'MskTopicAssetType',
        assetTypeDescription: 'Custom asset type to support MSK topic asset',
      }),
    );
  });
});

describe ('Creating a DataZoneMskAssetType with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';
  const GOVERNANCE_PROJECT_ID = '999a99aa9aaaaa';

  new DataZoneMskAssetType(stack, 'DataZoneMskAssetType', {
    domainId: DOMAIN_ID,
    projectId: GOVERNANCE_PROJECT_ID,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('should not create a default DataZone project', () => {
    template.resourceCountIs('AWS::DataZone::Project', 0);
  });

  test('should create a default DataZone project membership', () => {
    template.hasResourceProperties('AWS::DataZone::ProjectMembership',
      Match.objectLike({
        Designation: 'PROJECT_OWNER',
        DomainIdentifier: DOMAIN_ID,
        Member: {
          UserIdentifier: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('DataZoneMskAssetTypeDZCustomAssetTypeHandlerHandlerRole.*'),
              'Arn',
            ],
          },
        },
        ProjectIdentifier: GOVERNANCE_PROJECT_ID,
      }),
    );
  });

  test('should attach the custom asset type to the provided project', () => {
    template.hasResourceProperties('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        projectId: GOVERNANCE_PROJECT_ID,
      }),
    );
  });
});

describe ('Creating a DataZoneMskAssetType with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneMskAssetType(stack, 'DataZoneMskAssetType', {
    domainId: DOMAIN_ID,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create CloudWatch Log Groups with RETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });

  test('should create custom resources with RETAIN removal policy', () => {
    template.hasResource('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );
  });
});

describe ('Creating a DataZoneMskAssetType with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new DataZoneMskAssetType(stack, 'DataZoneMskAssetType', {
    domainId: DOMAIN_ID,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create CloudWatch Log Groups with RETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('should create custom resources with RETAIN removal policy', () => {
    template.hasResource('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});