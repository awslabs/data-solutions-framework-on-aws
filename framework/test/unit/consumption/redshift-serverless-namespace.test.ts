// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { RedshiftServerlessNamespace, RedshiftServerlessNamespaceLogExport } from '../../../src/consumption';


/**
 * Tests RedshiftServerlessNamespace construct
 *
 * @group unit/consumption/redshift-serverless-namespace
 */
describe('With default configuration, the construct', () => {

  const stack = new Stack();

  const adminIAMRole = new Role(stack, 'AdminRole', {
    assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    ],
  });

  const adminIAMRole2 = new Role(stack, 'AdminRole2', {
    assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    ],
  });

  new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
    dbName: 'defaultdb',
    name: 'defaultnamespace',
    defaultIAMRole: adminIAMRole,
    iamRoles: [
      adminIAMRole2,
    ],
    logExports: [
      RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
      RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
      RedshiftServerlessNamespaceLogExport.USER_LOG,
    ],
  });

  const template = Template.fromStack(stack);

  test('Should create new encryption key', () => {
    template.hasResource('AWS::KMS::Key', {});
  });

  test('Create namespace via Custom Resource', () => {
    template.hasResourceProperties('Custom::RedshiftServerlessNamespace', {
      namespaceName: Match.stringLikeRegexp('^defaultnamespace\-.+'),
    });
  });
  // test('Should create secret containing admin credentials', () => {
  //   template.hasResourceProperties('AWS::SecretsManager::Secret', {
  //     GenerateSecretString: {
  //       ExcludePunctuation: true,
  //       GenerateStringKey: Match.exact('password'),
  //       PasswordLength: 32,
  //       SecretStringTemplate: Match.exact('{"engine":"redshift","username":"admin","dbname":"defaultdb"}'),
  //     },
  //   });
  // });

  // test('Should create Redshift serverless namespace', () => {
  //   template.hasResourceProperties('AWS::RedshiftServerless::Namespace', {
  //     LogExports: Match.arrayEquals([
  //       RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
  //       RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
  //       RedshiftServerlessNamespaceLogExport.USER_LOG,
  //     ]),
  //     NamespaceName: Match.stringLikeRegexp('^defaultnamespace\-.+'),
  //     DbName: Match.exact('defaultdb'),
  //     DefaultIamRoleArn: {
  //       'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole.+'), 'Arn'],
  //     },
  //     IamRoles: Match.arrayEquals([
  //       { 'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole2.+'), 'Arn'] },
  //       { 'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole.+'), 'Arn'] },
  //     ]),
  //   });
  // });
});

// describe('Post addition of roles', () => {
//   const app = new App();
//   const stack = new Stack(app, 'Stack');

//   const adminIAMRole = new Role(stack, 'RSAdminRole', {
//     assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
//     managedPolicies: [
//       ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
//       ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
//     ],
//   });

//   const adminIAMRole2 = new Role(stack, 'RSAdminRole2', {
//     assumedBy: new ServicePrincipal('redshift.amazonaws.com'),
//     managedPolicies: [
//       ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftAllCommandsFullAccess'),
//       ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
//     ],
//   });

//   const namespace = new RedshiftServerlessNamespace(stack, 'DefaultNamespace', {
//     dbName: 'defaultdb',
//     name: 'defaultnamespace',
//     logExports: [
//       RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
//       RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
//       RedshiftServerlessNamespaceLogExport.USER_LOG,
//     ],
//   });

//   namespace.addIAMRole(adminIAMRole2);
//   namespace.defaultIAMRole(adminIAMRole);

//   const template = Template.fromStack(stack);

//   test('Should create Redshift serverless namespace', () => {
//     template.hasResourceProperties('AWS::RedshiftServerless::Namespace', {
//       LogExports: Match.arrayEquals([
//         RedshiftServerlessNamespaceLogExport.CONNECTION_LOG,
//         RedshiftServerlessNamespaceLogExport.USER_ACTIVITY_LOG,
//         RedshiftServerlessNamespaceLogExport.USER_LOG,
//       ]),
//       NamespaceName: Match.stringLikeRegexp('^defaultnamespace\-.+'),
//       DbName: Match.exact('defaultdb'),
//       DefaultIamRoleArn: {
//         'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole.+'), 'Arn'],
//       },
//       IamRoles: Match.arrayEquals([
//         { 'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole2.+'), 'Arn'] },
//         { 'Fn::GetAtt': [Match.stringLikeRegexp('^RSAdminRole.+'), 'Arn'] },
//       ]),
//     });
//   });
// });