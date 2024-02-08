// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { RemovalPolicy, CustomResource, Stack, Duration, Aws } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc, Peer, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AnyPrincipal, CfnServiceLinkedRole, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Domain, DomainProps, EngineVersion, SAMLOptionsProperty } from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';
import { OpensearchProps, OpensearchNodes } from './opensearch-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';

/**
 * A construct to provision Amazon Openssearch Cluster and Opensearch Dashboards.
 * Uses IAM Identity Center SAML authentication.
 * If Opensearch cluster is deployed in vpc created using DataVpc construct,
 * ClientVPNEndpoint will be provisioned automatically for secure access to Opnesearch Dashboards.
 *
 * @example
 *
 *    const osCluster = new dsf.storage.OpensearchCluster(this, 'MyOpensearchCluster',{
 *      domainName:"mycluster2",
 *      samlEntityId:'<IdpIdentityId>',
 *      samlMetadataContent:'<IdpMetadataXml>',
 *      samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
 *      deployInVpc:true,
 *      removalPolicy:cdk.RemovalPolicy.DESTROY
 *    } as dsf.storage.OpensearchProps );
 *
 *    osCluster.addRoleMapping('dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
 *    osCluster.addRoleMapping('readall','<IAMIdentityCenterDashboardUsersGroupId>');
 *
 *
*/

export class OpensearchCluster extends TrackedConstruct {

  /**
   * @public
   * OpensearchCluster domain
   */
  public readonly domain: Domain;

  /**
   * @public
   * Cloudwatch log group to store Opensearch cluster logs
   */
  public readonly logGroup: LogGroup;

  /**
   * @public
   * VPC Opensearch cluster is provisioned in.
   */
  public readonly vpc:IVpc | undefined;

  /**
   * CDK Custom resource provider for calling Opensearch APIs
   */
  private readonly apiProvider: DsfProvider;

  /**
   * IAM Role used to provision and configure Opensearch domain
   */
  private readonly masterRole: Role;

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
   * Constructs a new instance of the OpensearchCluster class
   * @param {Construct} scope the Scope of the AWS CDK Construct
   * @param {string} id the ID of the AWS CDK Construct
   * @param {OpensearchClusterProps} props the OpensearchCluster [properties]{@link OpensearchClusterProps}
   */

  constructor(scope: Construct, id: string, props: OpensearchProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: id,
    };

    super(scope, id, trackedConstructProps);

    //get or create service-linked role, required for vpc configuration
    try {
      Role.fromRoleName(this, 'OpensearchSlr', 'AWSServiceRoleForAmazonOpenSearchService');
    } catch (error) {
      new CfnServiceLinkedRole(this, 'ServiceLinkedRole', {
        awsServiceName: 'es.amazonaws.com',
      });
    }

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.logGroup = new LogGroup(this, 'OpensearchLogsCloudWatchLogGroup', {
      logGroupName: 'opensearch-domain-logs-'+props.domainName,
      encryptionKey: props.encryptionKmsKeyArn ? Key.fromKeyArn(this, 'OpensearchLogsCloudWatchEncryptionKey', props.encryptionKmsKeyArn) : undefined,
      removalPolicy: this.removalPolicy,
    });

    this.logGroup.grantWrite(new ServicePrincipal('es.amazonaws.com'));

    this.vpc = props.deployInVpc !=false ? (props.vpc ?? new DataVpc(scope, 'data-vpc-opensearch', { vpcCidr: '10.0.0.0/16' }).vpc ) : undefined;
    const vpcSubnetsSelection = this.vpc?.selectSubnets({ onePerAz: true, subnetType: SubnetType.PRIVATE_WITH_EGRESS });

    const kmsKey = props.encryptionKmsKeyArn ?
      Key.fromKeyArn(this, 'OpensearchEncryptionKey', props.encryptionKmsKeyArn) :
      new Key(this, 'OpensearchEncryptionKey', { removalPolicy: this.removalPolicy, enableKeyRotation: true });

    const masterRolePolicy = new ManagedPolicy(scope, 'masterRolePolicy');
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
        resources: [kmsKey.keyArn],
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

    const samlMetaData: SAMLOptionsProperty = {
      idpEntityId: props.samlEntityId,
      idpMetadataContent: props.samlMetadataContent,
      rolesKey: props.samlRolesKey ?? 'Role',
      subjectKey: props.samlSubjectKey,
      masterBackendRole: props.samlMasterBackendRole,
      sessionTimeoutMinutes: props.samlSessionTimeoutMinutes ?? Duration.hours(8).toMinutes(),
    };
    let clusterSg = undefined;
    if (this.vpc) {
      clusterSg = new SecurityGroup(scope, 'OpensearchSecurityGroup', {
        vpc: this.vpc,
        allowAllOutbound: true,
      });
      clusterSg.addIngressRule(Peer.ipv4(this.vpc.vpcCidrBlock), Port.tcp(443));
    }

    const defaultAzNumber = 2;
    const domainProps : DomainProps = {
      domainName: props.domainName,
      version: props.version ?? EngineVersion.OPENSEARCH_2_9,
      vpc: this.vpc,
      capacity: {
        masterNodes: props.masterNodeInstanceCount ?? 3,
        masterNodeInstanceType: props.masterNodeInstanceType ?? OpensearchNodes.MASTER_NODE_INSTANCE_DEFAULT,
        dataNodes: props.dataNodeInstanceCount ?? (vpcSubnetsSelection?.subnets.length || defaultAzNumber),
        dataNodeInstanceType: props.dataNodeInstanceType ?? OpensearchNodes.DATA_NODE_INSTANCE_DEFAULT,
        warmNodes: props.warmInstanceCount ?? 0,
        warmInstanceType: props.warmInstanceType ?? OpensearchNodes.WARM_NODE_INSTANCE_DEFAULT,
        multiAzWithStandbyEnabled: props.multiAzWithStandbyEnabled ?? false,
      },
      encryptionAtRest: {
        enabled: true,
        kmsKeyId: kmsKey.keyId,
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
        availabilityZoneCount: vpcSubnetsSelection?.subnets.length || defaultAzNumber,
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


    this.domain = new Domain(this, 'Domain', domainProps as DomainProps);

    this.domain.addAccessPolicies(
      new PolicyStatement({
        actions: ['es:ESHttp*'],
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        resources: [`arn:aws:es:${Aws.REGION}:${Aws.ACCOUNT_ID}:domain/${this.domain.domainName}/*`],
      }));

    this.apiProvider = new DsfProvider(this, 'Provider', {
      providerName: 'opensearchApiProvider',
      onEventHandlerDefinition: {
        managedPolicy: masterRolePolicy,
        handler: 'handler',
        depsLockFilePath: path.join(__dirname, './resources/lambda/package-lock.json'),
        entryFile: path.join(__dirname, './resources/lambda/opensearch-api.ts'),
        environment: {
          REGION: Stack.of(this).region,
          ENDPOINT: this.domain.domainEndpoint,
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


    const samlAdminGroupId = props.samlMasterBackendRole;


    //todo refactor to use new custom resource framework
    this.addRoleMapping('all_access', samlAdminGroupId);
    this.addRoleMapping('security_manager', samlAdminGroupId);
  }

  /**
   * Calls Opensearch API using custom resource.
   * @param apiPath  Opensearch API path
   * @param body  Opensearch API request body
   */

  private apiCustomResource(apiPath: string, body: any) {
    const cr = new CustomResource(this, 'ApiCR-'+ Math.random().toFixed(8), {
      serviceToken: this.apiProvider.serviceToken,
      resourceType: 'Custom::MyCustomResource',
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
   * This method is used to add a role mapping to the Amazon Opensearch cluster
   * @param name Opensearch role name @see https://opensearch.org/docs/2.9/security/access-control/users-roles/#predefined-roles
   * @param role IAM Identity center SAML group Id
   */
  public addRoleMapping(name: string, role: string) {
    this.apiCustomResource('_plugins/_security/api/rolesmapping/' + name, {
      backend_roles: [role],
    });
  }
}