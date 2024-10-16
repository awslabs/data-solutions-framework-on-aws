// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, Duration, Stack } from 'aws-cdk-lib';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Context } from './context';
import { CreateServiceLinkedRoleProps } from './create-service-linked-role-props';
import { DsfProvider } from './dsf-provider';
import { ServiceLinkedRoleService } from './service-linked-role-service';

/**
 * Create service linked role for the indicated service if it doesn't exists
 *
 * @example
 * const slr = new dsf.utils.CreateServiceLinkedRole(this, 'CreateSLR')
 * slr.create(dsf.utils.ServiceLinkedRoleService.REDSHIFT)
 */
export class CreateServiceLinkedRole extends Construct {

  private readonly serviceToken: string;
  private readonly providerRole: Role;

  constructor(scope: Construct, id: string, props?: CreateServiceLinkedRoleProps) {
    super(scope, id);
    const removalPolicy = Context.revertRemovalPolicy(scope, props?.removalPolicy);
    this.providerRole = new Role(this, 'ProviderRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    const provider = new DsfProvider(this, 'Provider', {
      providerName: 'CreateServiceLinkedRoleProvider',
      onEventHandlerDefinition: {
        iamRole: this.providerRole,
        depsLockFilePath: __dirname+'/resources/lambda/create-service-linked-role/package-lock.json',
        entryFile: __dirname+'/resources/lambda/create-service-linked-role/index.mjs',
        handler: 'index.handler',
        timeout: Duration.seconds(10),
      },
      removalPolicy,
    });

    this.serviceToken = provider.serviceToken;
  }

  /**
     * Creates the service linked role associated to the provided AWS service
     * @param slrService See `ServiceLinkedRoleService` for supported service constant
     * @returns `CustomResource` that manages  the creation of the Service Linked Role
     */
  public create(slrService: ServiceLinkedRoleService): CustomResource {
    this.providerRole.addToPrincipalPolicy(slrService.getCreateServiceLinkedRolePolicy(Stack.of(this).account));

    return new CustomResource(this, `CreateSLR-${slrService.roleName}`, {
      serviceToken: this.serviceToken,
      properties: {
        serviceName: slrService.serviceName,
      },
    });
  }
}