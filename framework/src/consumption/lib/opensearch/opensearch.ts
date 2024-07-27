// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy, Stack, Duration, Aws, CustomResource } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc, Peer, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AnyPrincipal, Effect, IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup, LogGroup } from 'aws-cdk-lib/aws-logs';
import { Domain, DomainProps, IDomain, SAMLOptionsProperty } from 'aws-cdk-lib/aws-opensearchservice';
import { AwsCustomResource, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { OpenSearchApi } from './opensearch-api';
import { OpenSearchClusterType } from './opensearch-api-props';
import { OpenSearchClusterProps, OpenSearchNodes, OPENSEARCH_DEFAULT_VERSION } from './opensearch-props';
import { Context, CreateServiceLinkedRole, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { ServiceLinkedRoleService } from '../../../utils/lib/service-linked-role-service';


/**
 * A construct to provision Amazon OpenSearch Cluster and OpenSearch Dashboards.
 * Uses IAM Identity Center SAML authentication.
 * If OpenSearch cluster is deployed in vpc created using DataVpc construct,
 * ClientVPNEndpoint will be provisioned automatically for secure access to OpenSearch Dashboards.
 *
 * @example
 *  const osCluster = new dsf.consumption.OpenSearchCluster(this, 'MyOpenSearchCluster',{
 *    domainName:"mycluster1",
 *    samlEntityId:'<IdpIdentityId>',
 *    samlMetadataContent:'<IdpMetadataXml>',
 *    samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
 *    deployInVpc:true,
 *    removalPolicy:cdk.RemovalPolicy.DESTROY
 *  });
 *
 *  osCluster.addRoleMapping('DashBoardUser', 'dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
 *  osCluster.addRoleMapping('ReadAllRole', 'readall','<IAMIdentityCenterDashboardUsersGroupId>');
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
   * IAM Role used to provision and configure OpenSearch domain
   */
  public readonly masterRole: IRole;

  /**
   * Opesearch API client
   * @see OpenSearchApi
   */
  private openSearchApi: OpenSearchApi;

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
    const slr = new CreateServiceLinkedRole(this, 'CreateSLR', {
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
    const vpcSubnetsSelection = props.vpcSubnets ?? { onePerAz: true, subnetType: SubnetType.PRIVATE_WITH_EGRESS };
    const subnets = this.vpc?.selectSubnets(vpcSubnetsSelection);

    const masterRolePolicy = new ManagedPolicy(this, 'MasterRolePolicy');
    masterRolePolicy.addStatements(
      new PolicyStatement({
        actions: [
          'es:ESHttp*',
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

    const azCount = subnets?.subnets?.length || 1;

    let zoneAwareness;
    if (azCount === undefined || azCount === 1) {
      zoneAwareness = false;
    } else {
      zoneAwareness = true;
    }

    const domainProps : DomainProps = {
      domainName: props.domainName,
      version: props.version ?? OPENSEARCH_DEFAULT_VERSION,
      vpc: this.vpc,
      vpcSubnets: [subnets],
      capacity: {
        masterNodes: props.masterNodeInstanceCount ?? 0,
        masterNodeInstanceType: props.masterNodeInstanceType ?? OpenSearchNodes.MASTER_NODE_INSTANCE_DEFAULT,
        dataNodes: props.dataNodeInstanceCount ?? azCount,
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
        enabled: zoneAwareness,
        availabilityZoneCount: azCount > 1 ? azCount : undefined,
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


    this.domain = domain;

    const samlAdminGroupId = props.samlMasterBackendRole;

    this.openSearchApi = new OpenSearchApi(scope, 'OpenSearchApi', {
      openSearchEndpoint: this.domain.domainEndpoint,
      openSearchClusterType: OpenSearchClusterType.PROVISIONED,
      iamHandlerRole: this.masterRole,
      vpc: this.vpc,
      subnets: subnets,
      removalPolicy: this.removalPolicy,
    });

    const allAccessRoleLambdaCr=this.openSearchApi.addRoleMapping('AllAccessRoleLambda', 'all_access', this.masterRole.roleArn, true);
    const allAccessRoleSamlCr=this.openSearchApi.addRoleMapping('AllAccessRoleSAML', 'all_access', samlAdminGroupId, true);
    allAccessRoleSamlCr.node.addDependency(allAccessRoleLambdaCr);

    const securityManagerRoleLambdaCr = this.openSearchApi.addRoleMapping('SecurityManagerRoleLambda', 'security_manager', this.masterRole.roleArn, true);
    securityManagerRoleLambdaCr.node.addDependency(allAccessRoleSamlCr);
    const securityManagerRoleSamlCr = this.openSearchApi.addRoleMapping('SecurityManagerRoleSAML', 'security_manager', samlAdminGroupId, true);
    securityManagerRoleSamlCr.node.addDependency(securityManagerRoleLambdaCr);

    //enable SAML authentication after adding lambda permissions to execute API calls later.
    const updateDomain = new AwsCustomResource(this, 'EnableInternalUserDatabaseCR', {
      installLatestAwsSdk: false,
      timeout: Duration.minutes(10),
      onCreate: {
        service: 'OpenSearch',
        action: 'updateDomainConfig',
        parameters: {
          DomainName: this.domain.domainName,
          AdvancedSecurityOptions: {
            SAMLOptions: {
              Enabled: true,
              Idp: {
                EntityId: samlMetaData.idpEntityId,
                MetadataContent: samlMetaData.idpMetadataContent,
              },
              MasterBackendRole: samlMetaData.masterBackendRole,
              RolesKey: samlMetaData.rolesKey,
              SessionTimeoutMinutes: samlMetaData.sessionTimeoutMinutes,
              SubjectKey: samlMetaData.subjectKey,
            },
          },
        },
        physicalResourceId: PhysicalResourceId.of('idpEntityId'),
        outputPaths: ['DomainConfig.AdvancedSecurityOptions.SAMLOptions'],
      },
      role: this.masterRole,
      removalPolicy: this.removalPolicy,
    });
    updateDomain.node.addDependency(this.domain);
    for (const aclCr of
      [allAccessRoleLambdaCr, allAccessRoleSamlCr, securityManagerRoleLambdaCr, securityManagerRoleSamlCr]) {
      updateDomain.node.addDependency(aclCr);
    }
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
    return this.openSearchApi.callOpenSearchApi(id, apiPath, body, method);
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
    return this.openSearchApi.addRoleMapping(id, name, role, persist);
  }
}