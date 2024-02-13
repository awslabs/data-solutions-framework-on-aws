// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CreateServiceLinkedRole } from '../../../src/utils';

/**
 * Tests CreateServiceLinkedRole construct
 *
 * @group unit/create-service-linked-role
 */

describe('With default configuration, the construct ', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack');
  const slr = new CreateServiceLinkedRole(stack, 'CreateSLR');
  slr.create('redshift.amazonaws.com');
  const template = Template.fromStack(stack);

  test('should create a custom resource containing service name', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
      serviceName: Match.exact('redshift.amazonaws.com'),
    });
  });
});