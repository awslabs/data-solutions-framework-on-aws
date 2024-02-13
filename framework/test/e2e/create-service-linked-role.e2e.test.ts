// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { CreateServiceLinkedRole } from '../../src/utils';
import { ServiceLinkedRoleService } from '../../src/utils/lib/service-linked-role-service';

/**
 * E2E test for CreateServiceLinkedRole
 *
 * @group e2e/utils/create-service-linked-role
 */

jest.setTimeout(9000000);
const testStack = new TestStack('CreateServiceLinkedRoleStack');
const { stack } = testStack;
const slrService = ServiceLinkedRoleService.REDSHIFT;
const roleNameToCheck = slrService.roleName;

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const slr = new CreateServiceLinkedRole(stack, 'CreateSLR');
const createResource = slr.create(slrService);

const createdRole = Role.fromRoleName(stack, 'CreatedSLRRole', roleNameToCheck);
createdRole.node.addDependency(createResource);

new CfnOutput(stack, 'SLRRoleArn', {
  value: createdRole.roleArn,
  exportName: 'SLRRoleArn',
});

let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 9000000);

test(' service linked role is created', async() => {
  expect(deployResult.SLRRoleArn).toContain(roleNameToCheck);
});

afterAll(async () => {
  await testStack.destroy();
}, 9000000);