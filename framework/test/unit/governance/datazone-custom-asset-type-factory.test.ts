// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * Tests DataZoneCustomAssetTypeFactory construct
 *
 * @group unit/datazone/datazone-custom-asset-type-factory
 */

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataZoneCustomAssetTypeFactory } from '../../../src/governance';


describe ('Creating a DataZoneCustomAssetTypeFactory with default configuration', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneCustomAssetTypeFactory(stack, 'DataZoneCustomAssetType', {
    domainId: DOMAIN_ID,
  });

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));


  test('should create an IAM role for the custom resource creating asset types', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        ManagedPolicyArns: [
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ]),
            ]),
          },
        ],
        Policies: [
          {
            PolicyDocument: Match.objectLike({
              Statement: [
                {
                  Action: [
                    'datazone:CreateFormType',
                    'datazone:CreateAssetType',
                    'datazone:DeleteAssetType',
                    'datazone:DeleteFormType',
                    'datazone:GetFormType',
                  ],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::Join': Match.arrayWith([
                      Match.arrayWith([
                        {
                          Ref: 'AWS::Partition',
                        },
                        ':datazone:',
                        {
                          Ref: 'AWS::Region',
                        },
                        ':',
                        {
                          Ref: 'AWS::AccountId',
                        },
                        `:domain/${DOMAIN_ID}`,
                      ]),
                    ]),
                  },
                },
              ],
            }),
            PolicyName: 'DataZonePermission',
          },
        ],
      }),
    );
  });

  test('should create a Lambda function for the metadata collector', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        Role: {
          'Fn::GetAtt': [
            Match.stringLikeRegexp('DataZoneCustomAssetTypeHandlerRole.*'),
            'Arn',
          ],
        },
        Runtime: 'nodejs20.x',
        Timeout: 120,
      }),
    );
  });
});

describe ('Creating a DataZoneCustomAssetTypeFactory with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  new DataZoneCustomAssetTypeFactory(stack, 'DataZoneCustomAssetType', {
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
});

describe ('Creating a DataZoneCustomAssetTypeFactory with DELETE removal but without global data removal', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const DOMAIN_ID = 'aba_dc999t9ime9sss';

  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  new DataZoneCustomAssetTypeFactory(stack, 'DataZoneCustomAssetType', {
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
});