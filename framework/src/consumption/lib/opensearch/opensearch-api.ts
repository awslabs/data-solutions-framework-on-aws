// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { CustomResource, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OpenSearchApiProps } from './opensearch-api-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * A construct to create an OpenSearch API client
 */
export class OpenSearchApi extends TrackedConstruct {

  /**
   * Custom resource provider for the OpenSearch API client
   */
  private apiProvider: DsfProvider;

  /**
   * The removal policy when deleting the CDK resources.
   * If DESTROY is selected, the context value '@data-solutions-framework-on-aws/removeDataOnDestroy'
   * in the 'cdk.json' or 'cdk.context.json' must be set to true
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  private removalPolicy: any;

  /**
   * Internal property to keep persistent IAM roles to prevent them from being overwritten
   * in subsequent API calls
   */
  private persistentRoles: {[key:string]:string[]} = {};

  /**
   * Constructs a new instance of the OpenSearch API construct.
   * @param scope Construct
   * @param id unique ID for the construct
   * @param props @see OpenSearchApiProps
   */
  constructor(scope: Construct, id: string, props: OpenSearchApiProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: OpenSearchApi.name,
    };

    super(scope, id, trackedConstructProps);


    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    this.apiProvider = new DsfProvider(this, 'Provider', {
      providerName: 'opensearchApiProvider',
      onEventHandlerDefinition: {
        iamRole: props.iamHandlerRole,
        handler: 'handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/opensearch-api/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/opensearch-api/opensearch-api.mjs'),
        environment: {
          REGION: props.openSearchEndpointRegion ?? Stack.of(this).region,
          ENDPOINT: props.openSearchEndpoint,
        },
        bundling: {
          nodeModules: [
            '@aws-crypto/sha256-js',
            '@aws-crypto/client-node',
            '@aws-sdk/client-secrets-manager',
            '@aws-sdk/node-http-handler',
            '@aws-sdk/protocol-http',
            '@aws-sdk/signature-v4',
          ],
        },
      },
      vpc: props.vpc,
      subnets: props.subnets,
      removalPolicy: this.removalPolicy,
    });
  }


  /**
   * Calls OpenSearch API using custom resource.
   * @param id The CDK resource ID
   * @param apiPath  OpenSearch API path
   * @param body  OpenSearch API request body
   * @param method Opensearch API method, @default PUT
   * @returns CustomResource object.
   */

  public callOpenSearchApi(id: string, apiPath: string, body: any, method?: string) : CustomResource {
    const cr = new CustomResource(this, id, {
      serviceToken: this.apiProvider.serviceToken,
      resourceType: 'Custom::OpenSearchAPI',
      properties: {
        path: apiPath,
        body,
        method: method ?? 'PUT',
      },
      removalPolicy: this.removalPolicy,
    });
    cr.node.addDependency(this.apiProvider);

    return cr;
  }

  /**
   * @public
   * Add a new role mapping to the cluster.
   * This method is used to add a role mapping to the Amazon OpenSearch cluster
   * @param id The CDK resource ID
   * @param name OpenSearch role name @see https://opensearch.org/docs/2.9/security/access-control/users-roles/#predefined-roles
   * @param role list of IAM roles. For IAM Identity center provide SAML group Id as a role
   * @param persist Set to true if you want to prevent the roles to be ovewritten by subsequent PUT API calls. Default false.
   * @returns CustomResource object.
   */
  public addRoleMapping(id: string, name: string, role: string, persist:boolean=false) : CustomResource {
    const persistentRoles = this.persistentRoles[name] || [];
    const rolesToPersist = persistentRoles.concat([role]);
    if (persist) {
      this.persistentRoles[name] = rolesToPersist;
    }
    return this.callOpenSearchApi(id, '_plugins/_security/api/rolesmapping/' + name, {
      backend_roles: rolesToPersist,
    });
  }
}