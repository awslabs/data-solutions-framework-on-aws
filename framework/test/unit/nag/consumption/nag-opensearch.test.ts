// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests OpenSearch cluster construct
 *
 * @group unit/nag/consumption/opensearch
 */

import { App, Aspects, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { OpensearchCluster } from '../../../../src/consumption';


const app = new App();
const stack = new Stack(app, 'Stack');

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// Instantiate AccessLogsBucket Construct with default
new OpensearchCluster(stack, 'Opensearch', {
  domainName: 'test',
  samlEntityId: '<idpTest>',
  samlMetadataContent: 'xmlCOntent',
  samlMasterBackendRole: 'IdpGroupId',
  deployInVpc: true,
  removalPolicy: RemovalPolicy.DESTROY,
});

Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Opensearch/SecurityGroup/Resource',
  [{ id: 'CdkNagValidationFailure', reason: 'VPC can be created or supplied as props, so cidr block is not known in advance' }],
);
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Opensearch/AccessRole/Resource',
  [{ id: 'AwsSolutions-IAM4', reason: 'this is default recommended IAM Role to use' }],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/AWS679f53fac002430cb0da5b7982bd2287/ServiceRole/Resource',
  [
    { id: 'AwsSolutions-IAM4', reason: 'AWSLambdaBasicExecutionRole this is default recommended IAM Policy to use' },
  ],
);
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  [
    { id: 'AwsSolutions-IAM4', reason: 'AWSLambdaBasicExecutionRole this is default recommended IAM Policy to use' },
  ],
);
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'The policy is provided by the Custom Resource framework and can\'t be updated' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/AWS679f53fac002430cb0da5b7982bd2287/Resource',
  [
    { id: 'AwsSolutions-L1', reason: 'Part of the Custom Resource framework and can\'t be updated' },
  ],
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Opensearch/Domain/ESLogGroupPolicyc80b19e6aba959e3e59e0abe35a41eab5b873c7f17/CustomResourcePolicy/Resource',
  [{ id: 'AwsSolutions-IAM5', reason: 'this is default recommended IAM Role to use' }],
);


NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Opensearch/MasterRolePolicy/Resource',
  [
    { id: 'AwsSolutions-IAM5', reason: 'Role needs access to all Opensearch APIs' },
    { id: 'AwsSolutions-IAM4', reason: 'Role needs access to all Opensearch APIs' },
  ],
);

//recommendaed FGAC https://docs.aws.amazon.com/opensearch-service/latest/developerguide/fgac.html
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/Stack/Opensearch/Domain/Resource',
  [
    { id: 'AwsSolutions-OS3', reason: 'SAML authentication is used to restrict access' },
    { id: 'AwsSolutions-OS5', reason: 'IAM-based access and SAML authentication for dashboards are used to restrict access' },
  ],
);


NagSuppressions.addResourceSuppressionsByPath(
  stack, [
    '/Stack/Opensearch/Provider/VpcPolicy/Resource',
    '/Stack/Opensearch/Provider/CleanUpProvider',
    '/Stack/Opensearch/CustomResourceProvider/framework-onEvent',
  ],
  [
    { id: 'AwsSolutions-IAM5', reason: 'Resource is not part of the test scope' },
    { id: 'AwsSolutions-IAM4', reason: 'Resource is not part of the test scope' },
    { id: 'AwsSolutions-L1', reason: 'Resource is not part of the test scope' },
  ],
  true,
);


test('No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  for (const error of errors) {
    expect(error.id+' '+error.entry.data).toHaveLength(0);
    console.log(error.id);
  }
  console.log(errors);
  expect(errors).toHaveLength(0);
});
