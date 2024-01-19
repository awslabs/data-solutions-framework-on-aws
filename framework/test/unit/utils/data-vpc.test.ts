// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DataVpc } from '../../../src/utils';

/**
 * Tests DataVpc construct
 *
 * @group unit/data-vpc
 */

describe('With default configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const dataVpc = new DataVpc(stack, 'DataVpc', {
    vpcCidr: '10.0.0.0/16',
  });

  dataVpc.tagVpc('test-tag', 'test-value');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a VPC with correct CIDR', () => {
    template.hasResource('AWS::EC2::VPC',
      Match.objectLike({
        Properties: {
          CidrBlock: Match.stringLikeRegexp('10.0.0.0/16'),
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'test-tag',
              Value: 'test-value',
            }),
          ]),
        },
      }),
    );
  });

  test('should create 2 private subnets with tags', () => {
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        }),
        Match.objectLike({
          Key: 'test-tag',
          Value: 'test-value',
        }),
      ]),
    }, 2);
  });

  test('should create 2 public subnets with tags', () => {
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        }),
        Match.objectLike({
          Key: 'test-tag',
          Value: 'test-value',
        }),
      ]),
    }, 2);
  });


  test('should create a KMS key for VPC flow logs encryption with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'vpc-logs-key',
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a log group for VPC flow log with 7 days retention andRETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      Properties: Match.objectLike({
        RetentionInDays: 7,
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With default configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const dataVpc = new DataVpc(stack, 'DataVpc', {
    vpcCidr: '10.0.0.0/16',
    flowLogRetention: RetentionDays.TWO_WEEKS,
  });

  dataVpc.tagVpc('test-tag', 'test-value');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a log group for VPC flow log with custom retention period', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      Properties: Match.objectLike({
        RetentionInDays: 14,
      }),
    });
  });
});

describe('With DESTROY removal policy and global data removal set to TRUE, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  // Set context value for global data removal policy
  stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const dataVpc = new DataVpc(stack, 'DataVpc', {
    vpcCidr: '10.0.0.0/16',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  dataVpc.tagVpc('test-tag', 'test-value');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a KMS key with DELETE removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'vpc-logs-key',
      }),
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should create a log group for VPC flow log with DELETE removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});

describe('With DESTROY removal policy and global data removal unset, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const dataVpc = new DataVpc(stack, 'DataVpc', {
    vpcCidr: '10.0.0.0/16',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  dataVpc.tagVpc('test-tag', 'test-value');

  const template = Template.fromStack(stack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a KMS key for VPC flow logs encryption with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'vpc-logs-key',
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a log group for VPC flow log with RETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});