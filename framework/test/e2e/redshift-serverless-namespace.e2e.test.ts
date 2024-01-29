// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { RedshiftServerlessNamespace } from '../../src/consumption';

/**
 * E2E test for RedshiftServerlessNamespace
 * @group e2e/redshift-serverless
 */

jest.setTimeout(6000000);
const testStack = new TestStack('RedshiftServerlessNamespaceTestStack');
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const namespace = new RedshiftServerlessNamespace(stack, 'TestNamespace', {
  name: 'e2e-namespace',
  dbName: 'defaultdb',
});

new CfnOutput(stack, 'NamespaceName', {
  value: namespace.namespaceName,
  exportName: 'NamespaceName',
});

new CfnOutput(stack, 'NamespaceID', {
  value: namespace.namespaceId,
  exportName: 'NamespaceID',
});

new CfnOutput(stack, 'NamespaceArn', {
  value: namespace.namespaceArn,
  exportName: 'NamespaceArn',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('Namespace is created', async() => {
  expect(deployResult.NamespaceName).toContain('e2e-namespace');
  expect(deployResult.NamespaceArn).toContain(deployResult.NamespaceID);

});

afterAll(async () => {
  await testStack.destroy();
}, 900000);