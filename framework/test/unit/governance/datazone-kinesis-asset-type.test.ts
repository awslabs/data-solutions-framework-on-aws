// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests DataZoneKinesisAssetType construct
 *
 * @group unit/datazone/datazone-kinesis-asset-type
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';

import { Match, Template } from 'aws-cdk-lib/assertions';

import { DataZoneKinesisAssetType } from '../../../src/governance';

describe('Creating a DataZoneKinesisAssetType with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneKinesisAssetType(stack, 'DataZoneKinesisAssetType', {
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
        Name: 'KinesisGovernance',
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
              Match.stringLikeRegexp('DataZoneKinesisAssetTypeDZCustomAssetTypeHandlerHandlerRole.*'),
              'Arn',
            ],
          },
        },
        ProjectIdentifier: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneKinesisAssetTypeKinesisAssetTypeProjectOwner.*'),
            'Id',
          ],
        },
      }),
    );
  });

  test('should create a custom resource for the Kinesis stream asset type', () => {
    template.hasResourceProperties('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        ServiceToken: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneKinesisAssetTypeDZCustomAssetTypeHandlerProviderCustomResourceProviderframeworkonEvent.*'),
            'Arn',
          ],
        },
        domainId: DOMAIN_ID, // Hardcoded domainId from the CFN template
        projectId: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneKinesisAssetTypeKinesisAssetTypeProjectOwner.*'),
            'Id',
          ],
        },
        formTypes: [
          {
            name: 'amazon.datazone.RelationalTableFormType',
            required: true,
          },
          {
            name: 'KinesisSourceReferenceFormType',
            model: '\n        structure KinesisSourceReferenceFormType {\n          @required\nstream_arn: String\n@required\nstream_capacity_mode: String\n\nstream_provisioned_shards: Integer\n        }\n      ',
            required: true,
          },
          {
            name: 'KinesisSchemaFormType',
            model: '\n        structure KinesisSchemaFormType {\n          @required\nstream_name: String\n@required\nschema_version: Integer\n@required\nschema_arn: String\n@required\nregistry_arn: String\n        }\n      ',
            required: true,
          },
        ],
        assetTypeName: 'KinesisStreamAssetType',
        assetTypeDescription: 'Custom asset type to support Kinesis Stream asset',
      }),
    );
  },
  );
});

describe('Creating a DataZoneKinesisAssetType with a provided project ID', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';
  const GOVERNANCE_PROJECT_ID = '999a99aa9aaaaa';

  new DataZoneKinesisAssetType(stack, 'DataZoneKinesisAssetType', {
    domainId: DOMAIN_ID,
    projectId: GOVERNANCE_PROJECT_ID,
  });

  const template = Template.fromStack(stack);


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
              Match.stringLikeRegexp('DataZoneKinesisAssetTypeDZCustomAssetTypeHandlerHandlerRole.*'),
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

describe('Creating a DataZoneKinesisAssetType with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneKinesisAssetType(stack, 'DataZoneKinesisAssetType', {
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

describe('Creating a DataZoneKinesisAssetType with DELETE removal with global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new DataZoneKinesisAssetType(stack, 'DataZoneKinesisAssetType', {
    domainId: DOMAIN_ID,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(stack);

  test('should create CloudWatch Log Groups with DELETE removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });

  test('should create custom resources with DELETE removal policy', () => {
    template.hasResource('Custom::DataZoneCustomAssetType',
      Match.objectLike({
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      }),
    );
  });
});
