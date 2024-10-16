// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
* Tests DataZoneMskAssetType
*
* @group unit/best-practice/datazone-msk-asset-type
*/


import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DataZoneMskAssetType } from '../../../../src/governance';

const app = new App();
const stack = new Stack(app, 'Stack');
const DOMAIN_ID = 'aba_dc999t9ime9sss';

new DataZoneMskAssetType(stack, 'MskAssetType', {
  domainId: DOMAIN_ID,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a',
  'Stack/MskAssetType/DZCustomAssetTypeHandler/Provider',
],
[
  { id: 'AwsSolutions-IAM4', reason: 'Inherited from DsfProvider construct, not in the scope of this test' },
  { id: 'AwsSolutions-IAM5', reason: 'Inherited from DsfProvider construct, not in the scope of this test' },
  { id: 'AwsSolutions-L1', reason: 'Inherited from DsfProvider construct, not in the scope of this test' },
],
true);

NagSuppressions.addResourceSuppressionsByPath(stack, [
  'Stack/MskAssetType/DZCustomAssetTypeHandler/HandlerRole/Resource',
],
[
  { id: 'AwsSolutions-IAM4', reason: 'Inherited from the DataZoneCustomAssetTypeFactory construct, not in the scope of this test' },
]);


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});