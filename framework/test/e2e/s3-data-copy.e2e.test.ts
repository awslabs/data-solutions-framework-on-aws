// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { TestStack } from './test-stack';
import { S3DataCopy, Utils } from '../../src/utils';

/**
 * E2E test for S3DataCopy
 * @group e2e/utils/s3-data-copy
 */

jest.setTimeout(9000000);
const testStack = new TestStack('S3DataCopyStack');
const { stack } = testStack;

// Set the context value for global data removal policy
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const sourceBucket = Bucket.fromBucketName(stack, 'SourceBucket', 'nyc-tlc');
const bucketName = `test-${stack.region}-${stack.account}-${Utils.generateUniqueHash(stack, 'TargetBucket')}`;

const targetBucket = new Bucket(stack, 'TargetBucket', {
  bucketName,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const vpc = new Vpc(stack, 'Vpc');

new S3DataCopy(stack, 'S3DataCopy', {
  sourceBucket,
  sourceBucketPrefix: 'trip data/',
  sourceBucketRegion: 'us-east-1',
  targetBucket,
  removalPolicy: RemovalPolicy.DESTROY,
  vpc,
  subnets: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
});

new CfnOutput(stack, 'Target', {
  value: targetBucket.bucketName,
});


let deployResult: Record<string, string>;

beforeAll(async() => {
  deployResult = await testStack.deploy();
}, 9000000);

test(' S3DataCopy is created', async() => {
  const regexPattern = /test-[a-z]{2}-[a-z]+-[0-9]-[0-9]{12}-[a-z0-9]{8}/;
  expect(deployResult.Target).toMatch(regexPattern);

} );

afterAll(async () => {
  await testStack.destroy();
}, 9000000);