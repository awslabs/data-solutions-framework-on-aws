// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { RemovalPolicy, CustomResource, Stack, Duration, Aws } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc, Peer, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AnyPrincipal, Effect, IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup } from 'aws-cdk-lib/aws-logs';
import { Domain, DomainProps, IDomain, SAMLOptionsProperty } from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';
import { OpenSearchClusterProps, OpenSearchNodes, OPENSEARCH_DEFAULT_VERSION } from './opensearch-props';
import { Context, CreateServiceLinkedRole, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';
import { ServiceLinkedRoleService } from '../../../utils/lib/service-linked-role-service';

/**
 * A construct to provision Amazon OpenSearch Cluster and OpenSearch Dashboards.
 * Uses IAM Identity Center SAML authentication.
 * If OpenSearch cluster is deployed in vpc created using DataVpc construct,
 * ClientVPNEndpoint will be provisioned automatically for secure access to OpenSearch Dashboards.
 *
 * @example
 *  const osCluster = new dsf.consumption.OpenSearchCluster(this, 'MyOpenSearchCluster',{
 *    domainName:"mycluster2",
 *    samlEntityId:'<IdpIdentityId>',
 *    samlMetadataContent:'<IdpMetadataXml>',
 *    samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
 *    deployInVpc:true,
 *    removalPolicy:cdk.RemovalPolicy.DESTROY
 *  } as dsf.consumption.OpenSearchProps );
 *
 *  osCluster.addRoleMapping('dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
 *  osCluster.addRoleMapping('readall','<IAMIdentityCenterDashboardUsersGroupId>');
 *
 *
*/

export class OpenSearchCluster extends TrackedConstruct {

  /**
   * OpenSearchCluster domain
   */
  public readonly domain: IDomain;

  /**
   * CloudWatch Logs Log Group to store OpenSearch cluster logs
   */
  public readonly logGroup: ILogGroup;

  /**
   * The KMS Key used to encrypt data and logs
   */
  public readonly encryptionKey: IKey;

  /**
   * VPC OpenSearch cluster is provisioned in.
   */
  public readonly vpc:IVpc | undefined;

  /**
   * CDK Custom resource provider for calling OpenSearch APIs
   */
  private readonly apiProvider: DsfProvider;

  /**
   * IAM Role used to provision and configure OpenSearch domain
   */
  public readonly masterRole: IRole;

  private prevCr?: CustomResource;

  /**
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket
   * If DESTROY is selected, the context value '@data-solutions-framework-on-aws/removeDataOnDestroy'
   * in the 'cdk.json' or 'cdk.context.json' must be set to true
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  private removalPolicy: RemovalPolicy;

  /**
   * Constructs a new instance of the OpenSearchCluster class
   * @param {Construct} scope the Scope of the AWS CDK Construct
   * @param {string} id the ID of the AWS CDK Construct
   * @param {OpenSearchClusterProps} props the OpenSearchCluster [properties]{@link OpenSearchClusterProps}
   */

  constructor(scope: Construct, id: string, props: OpenSearchClusterProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: OpenSearchCluster.name,
    };

    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    //get or create service-linked role, required for vpc configuration
    const slr = new CreateServiceLinkedRole(scope, 'CreateSLR', {
      removalPolicy: this.removalPolicy,
    });
    slr.create(ServiceLinkedRoleService.OPENSEARCH);

    this.encryptionKey = props.encryptionKey || new Key(this, 'EncryptionKey', { removalPolicy: this.removalPolicy, enableKeyRotation: true });

    this.logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: 'opensearch-domain-logs-'+props.domainName,
      encryptionKey: this.encryptionKey,
      removalPolicy: this.removalPolicy,
    });

    this.encryptionKey.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(`logs.${Stack.of(scope).region}.amazonaws.com`)],
        actions: [
          'kms:Encrypt*',
          'kms:Decrypt*',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:Describe*',
        ],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${Stack.of(scope).region}:${Stack.of(scope).account}:*`,
          },
        },
        resources: ['*'],
      }),
    );

    this.logGroup.grantWrite(new ServicePrincipal('es.amazonaws.com'));

    if (props.deployInVpc!=false && !props.vpc && props.vpcSubnets?.subnets?.length) {
      throw new Error('VPC subnet configuration is only allowed when custom VPC is provided');
    }

    this.vpc = props.deployInVpc !=false ? (props.vpc ?? new DataVpc(this, 'DataVpc', { vpcCidr: '10.0.0.0/16', removalPolicy: this.removalPolicy }).vpc ) : undefined;
    const vpcSubnetsSelection = props.vpcSubnets ?? this.vpc?.selectSubnets({ onePerAz: true, subnetType: SubnetType.PRIVATE_WITH_EGRESS });

    const masterRolePolicy = new ManagedPolicy(this, 'MasterRolePolicy');
    masterRolePolicy.addStatements(
      new PolicyStatement({
        actions: [
          'es:ESHttpPut',
          'es:UpdateElasticsearchDomainConfig',
        ],
        resources: [`arn:aws:es:${Aws.REGION}:${Aws.ACCOUNT_ID}:domain/${props.domainName}/*`],
      }),
      new PolicyStatement({
        actions: ['kms:DescribeKey'],
        resources: [this.encryptionKey.keyArn],
      }),
    );

    if (this.vpc) {
      masterRolePolicy.addStatements(
        new PolicyStatement({
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'ec2:AssignPrivateIpAddresses',
            'ec2:UnassignPrivateIpAddresses',
          ],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      );
    }

    this.masterRole = new Role(this, 'AccessRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        masterRolePolicy,
      ],
    });

    if (props.samlSessionTimeout) {
      if (props.samlSessionTimeout.toMinutes() > 1440) {
        throw new Error('The maximum allowed session timeout is 1440 minutes');
      }
    }
    const samlMetaData: SAMLOptionsProperty = {
      idpEntityId: props.samlEntityId,
      idpMetadataContent: props.samlMetadataContent,
      rolesKey: props.samlRolesKey ?? 'Role',
      subjectKey: props.samlSubjectKey,
      masterBackendRole: props.samlMasterBackendRole,
      sessionTimeoutMinutes: props.samlSessionTimeout?.toMinutes() ?? Duration.hours(8).toMinutes(),
    };
    let clusterSg = undefined;
    if (this.vpc) {
      clusterSg = new SecurityGroup(this, 'SecurityGroup', {
        vpc: this.vpc,
        allowAllOutbound: true,
      });
      clusterSg.addIngressRule(Peer.ipv4(this.vpc.vpcCidrBlock), Port.tcp(443));
    }

    const defaultAzNumber = 2;
    const domainProps : DomainProps = {
      domainName: props.domainName,
      version: props.version ?? OPENSEARCH_DEFAULT_VERSION,
      vpc: this.vpc,
      vpcSubnets: props.vpcSubnets ? vpcSubnetsSelection?.subnets : undefined,
      capacity: {
        masterNodes: props.masterNodeInstanceCount ?? 3,
        masterNodeInstanceType: props.masterNodeInstanceType ?? OpenSearchNodes.MASTER_NODE_INSTANCE_DEFAULT,
        dataNodes: props.dataNodeInstanceCount ?? (vpcSubnetsSelection?.subnets?.length || defaultAzNumber),
        dataNodeInstanceType: props.dataNodeInstanceType ?? OpenSearchNodes.DATA_NODE_INSTANCE_DEFAULT,
        warmNodes: props.warmInstanceCount ?? 0,
        warmInstanceType: props.warmInstanceType ?? OpenSearchNodes.WARM_NODE_INSTANCE_DEFAULT,
        multiAzWithStandbyEnabled: props.multiAzWithStandbyEnabled ?? false,
      },
      encryptionAtRest: {
        enabled: true,
        kmsKeyId: this.encryptionKey.keyId,
      },
      ebs: {
        volumeSize: props.ebsSize ?? 10,
        volumeType: props.ebsVolumeType ?? EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
      },
      fineGrainedAccessControl: {
        masterUserArn: this.masterRole.roleArn,
        samlAuthenticationEnabled: true,
        samlAuthenticationOptions: samlMetaData,
      },
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: vpcSubnetsSelection?.subnets?.length || defaultAzNumber,
      },
      nodeToNodeEncryption: true,
      useUnsignedBasicAuth: false,
      enforceHttps: true,

      logging: {
        slowSearchLogEnabled: true,
        slowSearchLogGroup: this.logGroup,
        appLogEnabled: true,
        appLogGroup: this.logGroup,
        slowIndexLogEnabled: true,
        slowIndexLogGroup: this.logGroup,
        auditLogEnabled: true,
        auditLogGroup: this.logGroup,
      },
      enableAutoSoftwareUpdate: props.enableAutoSoftwareUpdate ?? false,
      enableVersionUpgrade: props.enableVersionUpgrade ?? false,
      removalPolicy: this.removalPolicy,
      securityGroups: [clusterSg],
    } as DomainProps;


    const domain = new Domain(this, 'Domain', domainProps as DomainProps);

    domain.addAccessPolicies(
      new PolicyStatement({
        actions: ['es:ESHttp*'],
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        resources: [`arn:aws:es:${Aws.REGION}:${Aws.ACCOUNT_ID}:domain/${domain.domainName}/*`],
      }));

    this.apiProvider = new DsfProvider(this, 'Provider', {
      providerName: 'opensearchApiProvider',
      onEventHandlerDefinition: {
        managedPolicy: masterRolePolicy,
        handler: 'handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/opensearch-api/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/opensearch-api/opensearch-api.mjs'),
        environment: {
          REGION: Stack.of(this).region,
          ENDPOINT: domain.domainEndpoint,
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
      vpc: this.vpc,
      subnets: vpcSubnetsSelection,
    });

    this.domain = domain;

    const samlAdminGroupId = props.samlMasterBackendRole;

    this.addRoleMapping('AllAccessOsRole', 'all_access', samlAdminGroupId);
    this.addRoleMapping('SecurityManagerOsRole', 'security_manager', samlAdminGroupId);
  }

  /**
   * Calls OpenSearch API using custom resource.
   * @param id The CDK resource ID
   * @param apiPath  OpenSearch API path
   * @param body  OpenSearch API request body
   */

  public callOpenSearchApi(id: string, apiPath: string, body: any) {
    const cr = new CustomResource(this, id, {
      serviceToken: this.apiProvider.serviceToken,
      resourceType: 'Custom::OpenSearchAPI',
      properties: {
        path: apiPath,
        body,
      },
    });
    cr.node.addDependency(this.domain);
    if (this.prevCr) cr.node.addDependency(this.prevCr);
    this.prevCr = cr;
  }

  /**
   * @public
   * Add a new role mapping to the cluster.
   * This method is used to add a role mapping to the Amazon OpenSearch cluster
   * @param id The CDK resource ID
   * @param name OpenSearch role name @see https://opensearch.org/docs/2.9/security/access-control/users-roles/#predefined-roles
   * @param role IAM Identity center SAML group Id
   */
  public addRoleMapping(id: string, name: string, role: string) {
    this.callOpenSearchApi(id, '_plugins/_security/api/rolesmapping/' + name, {
      backend_roles: [role],
    });
  }
}