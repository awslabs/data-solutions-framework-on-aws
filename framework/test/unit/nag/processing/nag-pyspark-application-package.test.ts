// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Nag for PySpark application package construct
 *
 * @group unit/best-practice/pyspark-application-package
 */

import path from 'path';
import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { PySparkApplicationPackage } from '../../../../src';


const app = new App();
const stack = new Stack(app, 'Stack');

new PySparkApplicationPackage (stack, 'PySparkPacker', {
  pysparkApplicationName: 'my-pyspark',
  entrypointPath: path.join(__dirname, '../../../resources/processing/pyspark-application-package/src/pyspark.py'),
  dependenciesFolder: path.join(__dirname, '../../../resources/processing/pyspark-application-package'),
  venvArchivePath: '/output/pyspark.tar.gz',
  removalPolicy: RemovalPolicy.DESTROY,
});

Aspects.of(stack).add(new AwsSolutionsChecks());

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB1000MiB/Resource',
  [{ id: 'AwsSolutions-L1', reason: 'The lambda is provided by the Asset L2 construct and we can\'t upgrade the runtime' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/PySparkPacker/s3BucketDeploymentRole/DefaultPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'Permissions provided by the `grantRead()` and `grantWrite()`method of the `Bucket` L2 construct' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/PySparkPacker/s3BucketDeploymentPolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'The CLoudWtach Logs Log Group used for the `BucketDeployemnt` is unknown and can\'t be tagged for scoping down' }],
);

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

