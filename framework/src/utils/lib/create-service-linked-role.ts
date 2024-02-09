// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, Duration } from 'aws-cdk-lib';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Context } from './context';
import { CreateServiceLinkedRoleProps } from './create-service-linked-role-props';
import { DsfProvider } from './dsf-provider';

/**
 * @internal
 * Create service linked role for the indicated service if it doesn't exists
 *
 * @example
 * const slr = new dsf.utils.CreateServiceLinkedRole(this, 'CreateSLR')
 * slr.create('redshift.amazonaws.com')
 */
export class CreateServiceLinkedRole extends Construct {

  private readonly serviceToken: string;

  constructor(scope: Construct, id: string, props: CreateServiceLinkedRoleProps) {
    super(scope, id);
    const removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
    const providerRole = new Role(this, 'CreateServiceLinkedRoleProviderRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        iamPermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'iam:CreateServiceLinkedRole',
                'iam:DeleteServiceLinkedRole',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const provider = new DsfProvider(this, 'CreateServiceLinkedRoleProvider', {
      providerName: 'CreateServiceLinkedRoleProvider',
      onEventHandlerDefinition: {
        iamRole: providerRole,
        depsLockFilePath: __dirname+'/resources/lambda/create-service-linked-role/package-lock.json',
        entryFile: __dirname+'/resources/lambda/create-service-linked-role/index.mjs',
        handler: 'index.handler',
        timeout: Duration.seconds(1),
      },
      removalPolicy,
    });

    this.serviceToken = provider.serviceToken;
  }

  /**
     * Creates the service linked role associated to the provided AWS service
     * @param awsServiceName The AWS service to create the service linked role for
     * @returns `CustomResource` that manages  the creation of the Service Linked Role
     */
  public create(awsServiceName: string): CustomResource {
    return new CustomResource(this, `CreateSLR-${awsServiceName}`, {
      serviceToken: this.serviceToken,
      properties: {
        serviceName: awsServiceName,
      },
    });
  }
}