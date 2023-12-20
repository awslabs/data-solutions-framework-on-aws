// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import path from 'path';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { TestStack } from './test-stack';
import { PySparkApplicationPackage } from '../../src/processing';

/**
 * E2E test for PySparkApplicationPackage
 * @group e2e/processing/pyspark-application-package
 */

jest.setTimeout(6000000);
const testStack = new TestStack('PySparkApplicationPackageStack');
const { stack } = testStack;

// Set the context value for global data removal policy
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const appName = 'my-spark';

const pysparkApp = new PySparkApplicationPackage (stack, 'PySparkPacker', {
  applicationName: appName,
  entrypointPath: path.join(__dirname, '../resources/processing/pyspark-application-package/src/pyspark.py'),
  dependenciesFolder: path.join(__dirname, '../resources/processing/pyspark-application-package'),
  venvArchivePath: '/output/pyspark.tar.gz',
  removalPolicy: RemovalPolicy.DESTROY,
});

let deployResult: Record<string, string>;

new CfnOutput(stack, 'PySparkAppEntrypointS3Uri', {
  value: pysparkApp.entrypointS3Uri,
  exportName: 'PySparkAppEntrypointS3Uri',
});

new CfnOutput(stack, 'PySparkVenvArchiveS3Uri', {
  value: pysparkApp.venvArchiveS3Uri || 'no_venv',
  exportName: 'PySparkVenvArchiveS3Uri',
});

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 900000);

test('PySparkApplicationPackage deployed successfully', async() => {
  expect(deployResult.PySparkAppEntrypointS3Uri).toContain(`${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${appName}/pyspark.py`);
  expect(deployResult.PySparkVenvArchiveS3Uri).toContain(`${PySparkApplicationPackage.ARTIFACTS_PREFIX}/${appName}/pyspark.tar.gz`);
});

afterAll(async () => {
  await testStack.destroy();
}, 900000);