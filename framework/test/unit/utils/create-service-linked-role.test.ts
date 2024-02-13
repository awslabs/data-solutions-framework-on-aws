// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CreateServiceLinkedRole } from '../../../src/utils';
import { ServiceLinkedRoleService } from '../../../src/utils/lib/service-linked-role-service';

/**
 * Tests CreateServiceLinkedRole construct
 *
 * @group unit/create-service-linked-role
 */

describe('With default configuration, the construct ', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const slr = new CreateServiceLinkedRole(stack, 'CreateSLR');
  const slrService = ServiceLinkedRoleService.REDSHIFT;
  slr.create(slrService);
  const template = Template.fromStack(stack);

  test('should create a custom resource containing service name', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      serviceName: Match.exact('redshift.amazonaws.com'),
    });
  });

  test('should create a policy for the custom resource role that\'s scoped down to the service it\'s creating a role for', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.exact('iam:CreateServiceLinkedRole'),
            Resource: Match.not(Match.exact('*')),
            Condition: Match.objectEquals({
              StringLike: Match.objectEquals({
                'iam:AWSServiceName': slrService.serviceName,
              }),
            }),
          }),
        ]),
      }),
    });
  });
});