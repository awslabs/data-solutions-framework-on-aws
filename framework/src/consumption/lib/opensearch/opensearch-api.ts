// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { CustomResource, Stack } from 'aws-cdk-lib';
import { ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { OpenSearchApiProps } from './opensearch-api-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * A construct to create an OpenSearch API client
 *
 * @example
 *  // eslint-disable-next-line
 *  const domainEndpoint='https://search-XXXXXX.XXXXXX.es.amazonaws.com';
 *  const apiRole = cdk.iam.Role.fromRoleName(this, 'ApiRole', '<IAMRoleWithOpenSearchPermissions>');
 *  const osApi = new dsf.consumption.OpensearchApi(this, 'MyOpenSearchApi',{
 *    iamHandlerRole:apiRole,
 *    openSearchEndpoint:domainEndpoint,
 *    openSearchClusterType:dsf.consumption.OpenSearchClusterType.PROVISIONED,
 *    removalPolicy:cdk.RemovalPolicy.DESTROY
 *  });
 *
 *  const roleMap = osApi.addRoleMapping('DashBoardUser', 'dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
 *  const add1Cr = osApi.callOpenSearchApi('AddData1', 'movies-01/_doc/1111',{"title": "Rush", "year": 2013}, 'PUT');
 *  add1Cr.node.addDependency(roleMap);
 *  const add2Cr = osApi.callOpenSearchApi('AddData3', 'movies-01/_doc/2222',{"title": "Toy Story", "year": 2014}, 'PUT');
 *  add2Cr.node.addDependency(roleMap);
 */

export class OpenSearchApi extends TrackedConstruct {

  /**
   * The CloudWatch Log Group for the  onEventHandler Lambda Function
   */
  public apiLogGroup: ILogGroup;

  /**
   * The list of EC2 Security Groups used by the Lambda Functions
   */
  public apiSecurityGroups?: ISecurityGroup[];

  /**
   * The Lambda Function used for the onEventHandler
   */
  public apiFunction: IFunction;

  /**
   * The IAM Role for the onEventHandler Lambba Function
   */
  public apiRole: IRole;

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
      queryInterval: props.queryInterval ?? undefined,
      queryTimeout: props.queryTimeout ?? undefined,
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
      securityGroups: props.securityGroups,
      removalPolicy: this.removalPolicy,
    });

    this.apiLogGroup = this.apiProvider.onEventHandlerLogGroup;
    this.apiSecurityGroups = this.apiProvider.securityGroups;
    this.apiFunction = this.apiProvider.onEventHandlerFunction;
    this.apiRole = this.apiProvider.onEventHandlerRole;

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