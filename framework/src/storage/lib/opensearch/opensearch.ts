// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import {
  RemovalPolicy,
  CustomResource,
  Stack,
  CfnOutput,
  Duration,
  Aws,
} from 'aws-cdk-lib';
import { EbsDeviceVolumeType, IVpc, Peer, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AccountPrincipal, AnyPrincipal, CfnServiceLinkedRole, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Domain, DomainProps, EngineVersion, SAMLOptionsProperty } from 'aws-cdk-lib/aws-opensearchservice';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { /*AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId,*/ Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { OpensearchProps, OpensearchNodes } from './opensearch-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import path = require('path');
import { OpensearchProxy } from './opensearch-proxy';
import { readFileSync } from 'fs';


export class OpensearchCluster extends TrackedConstruct {
  /**
   * @public
   * Get an existing OpensearchCluster based on the cluster name property or create a new one
   * only one Opensearch cluster can exist per stack
   * @param {Construct} scope the CDK scope used to search or create the cluster
   * @param {OpensearchClusterProps} props the OpensearchClusterProps [properties]{@link OpensearchClusterProps} if created
   */

  public readonly domain: Domain;
  public readonly logGroup: LogGroup;
  public readonly vpc:IVpc;
  public readonly opensearchProxy: OpensearchProxy;
  private readonly apiProvider: Provider;
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
   * @public
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

    this.logGroup = new LogGroup(this, 'SparkLogsCloudWatchLogGroup', {
      logGroupName: 'opensearch-domain-logs-'+id,
      encryptionKey: props.encryptionKmsKeyArn ? Key.fromKeyArn(this, 'OpensearchLogsCloudWatchEncryptionKey', props.encryptionKmsKeyArn) : undefined,
      removalPolicy: this.removalPolicy,
    });

    this.logGroup.grantWrite(new ServicePrincipal('es.amazonaws.com'));

    this.masterRole = new Role(this, 'AccessRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.masterRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'es:ESHttpPut',
          'es:UpdateElasticsearchDomainConfig',
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
        ],
        resources: [`arn:aws:es:${Aws.REGION}:${Aws.ACCOUNT_ID}:domain/${props.domainName}/*`],
      }),
    );

    this.vpc = props.vpc ?? new DataVpc(scope, 'data-vpc-opensearch', { vpcCidr: '10.0.0.0/16',  }).vpc;
    const vpcSubnetsSelection = this.vpc.selectSubnets({onePerAz:true,subnetType:SubnetType.PRIVATE_WITH_EGRESS});

    const kmsKey = props.encryptionKmsKeyArn ?
      Key.fromKeyArn(this, 'OpensearchEncryptionKey', props.encryptionKmsKeyArn) :
      new Key(this, 'OpensearchEncryptionKey', { removalPolicy: this.removalPolicy, enableKeyRotation: true });


    this.masterRole.addToPolicy(
      new PolicyStatement({
        actions: ['kms:DescribeKey'],
        resources: [kmsKey.keyArn],
      }),
    );

    this.masterRole.addToPolicy(
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
      })
    )

    const samlMetaData: SAMLOptionsProperty = {
      idpEntityId:  props.saml?.idpEntityId ?? '',
      idpMetadataContent: props.saml?.idpMetadataContent ?? readFileSync(path.join(__dirname,'./resources/saml-config.xml'),'utf-8'),
      rolesKey: props.saml?.rolesKey ?? 'Role',
      subjectKey: props.saml?.subjectKey ?? 'Subject',
      sessionTimeoutMinutes: props.saml?.sessionTimeoutMinutes ?? Duration.hours(8).toMinutes(),
    };

    const clusterSg = new SecurityGroup(scope, 'OpensearchSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: true
    })
    clusterSg.addIngressRule(Peer.ipv4(this.vpc.vpcCidrBlock), Port.tcp(443))

    const domainProps : DomainProps = {
      domainName: props.domainName,
      version: props.version ?? EngineVersion.OPENSEARCH_2_9,
      vpc: this.vpc,
      capacity: {
        masterNodes: props.masterNodeInstanceCount ?? 3,
        masterNodeInstanceType: props.masterNodeInstanceType ?? OpensearchNodes.MASTER_NODE_INSTANCE_DEFAULT,
        dataNodes: props.dataNodeInstanceCount ?? vpcSubnetsSelection.subnets.length,
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
        availabilityZoneCount: vpcSubnetsSelection.subnets.length,
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
        actions: ['es:*'],
        effect: Effect.ALLOW,
        principals:[new AnyPrincipal()],
        resources: [`arn:aws:es:${Aws.REGION}:${Aws.ACCOUNT_ID}:domain/${this.domain.domainName}/*`],
      }));
    const apiFn = new NodejsFunction(this, 'api', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname,'resources/lambda/opensearch-api.ts'),
      handler: 'handler',
      environment: {
        REGION: Stack.of(this).region,
        ENDPOINT: this.domain.domainEndpoint,
      },
      role: this.masterRole,
      timeout: Duration.minutes(1),
      logRetention: RetentionDays.ONE_WEEK,
      vpc:this.vpc,
      vpcSubnets: vpcSubnetsSelection,
    });

    this.apiProvider = new Provider(this, 'Provider/' + id, {
      onEventHandler: apiFn,
    });


    this.domain.addAccessPolicies(
      new PolicyStatement({
        actions: ['es:*'],
        effect: Effect.ALLOW,
        principals: [new AccountPrincipal(Stack.of(this).account)],
        resources: [this.domain.domainArn, `${this.domain.domainArn}/*`],
      }),
    );
    
    //const masterUser = props.masterUserName ?? 'root';
    //this.addAdminUser(masterUser,masterUser);
   
    const samlAdminGroupId = props.samlAdminGroupId ?? 'iam-adminid'
      /*new CfnGroup(scope,'adminGroup',{
        description: 'Opensearch Dashboards Admin Group',
        identityStoreId:props.saml.idpEntityId,
        displayName:'OpensearchDashboardsAdminGroup',
      }).attrGroupId;*/
   
    const samlDashboardGroupId = props.samlDashboardGroupId ?? 'iam-dashboardid'
   
   /*new CfnGroup(scope,'dashboardGroup',{
        description: 'Opensearch Dashboards User Group',
        identityStoreId:props.saml.idpEntityId,
        displayName:'OpensearchDashboardsUserGroup',       
      }).attrGroupId;*/
    
    //todo refactor to use new custom resource framework
    this.addRoleMapping('all_access_'+samlAdminGroupId, 'all_access', samlAdminGroupId);
    this.addRoleMapping('security_manager_'+samlAdminGroupId, 'security_manager', samlAdminGroupId);
    this.addRoleMapping('dashboard_'+samlDashboardGroupId, 'opensearch_dashboards_user', samlDashboardGroupId);
    


    //usernames.map((username) => this.addDasboardUser(username, username));
    //accessRoles.map((accessRole) => this.addAccessRole(accessRole.toString(), accessRole));
    


    // create proxy to get access inside VPC
    this.opensearchProxy = new OpensearchProxy(scope, 'OpensearchProxy', {
      opensearchCluster: this as OpensearchCluster,
      proxyPort:props.proxyPort ?? 8080,
    });
    this.opensearchProxy.node.addDependency(this.domain);

    /*new AwsCustomResource(this, 'EnableInternalUserDatabaseCR', {
      vpc:this.vpc,
      vpcSubnets: vpcSubnetsSelection,
      installLatestAwsSdk:false,
      onCreate: {
        service: 'OpenSearch',
        action: 'updateDomainConfig',
        parameters: {
          DomainName: this.domain.domainName,
          AdvancedSecurityOptions: {
            InternalUserDatabaseEnabled: true,
          },
        },
        physicalResourceId: PhysicalResourceId.of('InternalUserDatabase'),
        outputPaths: ['DomainConfig.AdvancedSecurityOptions'],
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.domain.domainArn],
      }),
    });
    */
  }

  private apiCustomResource(id: string, path: string, body: any) {

    const cr = new CustomResource(this, 'ApiCR/'+ Math.random().toFixed(8), {
      serviceToken:  this.apiProvider.serviceToken,
      properties: {
        path,
        body,
      },
    });
    cr.node.addDependency(this.domain);
    if (this.prevCr) cr.node.addDependency(this.prevCr);
    this.prevCr = cr;
    console.log(id);
  }

  /**
   * @public
   * Add a new admin user to the cluster.
   * This method is used to add an admin user to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} username the username
   */
  public addAdminUser(id: string, username: string) {
    this.addUser(id, username, ['all_access', 'security_manager']);
  }

  /**
   * @public
   * Add a new dashboard user to the cluster.
   * This method is used to add a dashboard user to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} username the username
   */
  public addDasboardUser(id: string, username: string) {
    this.addUser(id, username, ['opensearch_dashboards_user']);
  }

  /**
   * @public
   * Add a new user to the cluster.
   * This method is used to add a user to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} username the username
   * @param {object} template the permissions template
   */
  public addUser(id: string, username: string, template: Array<string>) {
    const secret = new Secret(this, `${username}-Secret`, {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username }),
        generateStringKey: 'password',
      },
    });
    new CfnOutput(this, 'output-' + id, {
      description: 'Secret with Username & Password for user ' + username,
      value: secret.secretName,
    });
    secret.grantRead(this.masterRole);
    this.apiCustomResource(id, '_plugins/_security/api/internalusers/' + username, {
      passwordFieldSecretArn: secret.secretArn,
      opendistro_security_roles: template,
    });
  }

  /**
   * @public
   * Add a new access role to the cluster.
   * This method is used to add an access role to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {aws_iam.Role} role the iam role
   */
  public addAccessRole(id: string, role: Role) {
    const name = role.roleName;
    this.domain.grantIndexReadWrite('*', role);
    this.domain.grantPathReadWrite('*', role);
    this.domain.grantReadWrite(role);

    this.addRole('role-' + id, name, {
      cluster_permissions: ['cluster_composite_ops', 'cluster_monitor'],
      index_permissions: [
        {
          index_patterns: ['*'],
          allowed_actions: ['crud', 'create_index', 'manage'],
        },
      ],
    });

    this.addRoleMapping('mapping-' + id, name, role);
  }

  /**
   * @public
   * Add a new role to the cluster.
   * This method is used to add a security role to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} name the role name
   * @param {object} template the permissions template
   */
  public addRole(id: string, name: string, template: object) {
    this.apiCustomResource(id, '_plugins/_security/api/roles/' + name, template);
  }

  /**
   * @public
   * Add a new role mapping to the cluster.
   * This method is used to add a role mapping to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} name the role name
   * @param {aws_iam.Role | string } role the iam role or SAML group Id to map
   */
  public addRoleMapping(id: string, name: string, role: Role | string) {
    this.apiCustomResource(id, '_plugins/_security/api/rolesmapping/' + name, {
      backend_roles: [role instanceof Role ? role.roleArn : role],
    });
  }

  /**
   * @public
   * Add a new index to the cluster.
   * This method is used to add an index to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} name the role name
   * @param {object} template the permissions template
   */
  public addIndex(id: string, name: string, template: any) {
    this.apiCustomResource(id, '/' + name, template);
  }

  /**
   * @public
   * Add a new rollup strategy to the cluster.
   * This method is used to add a rollup strtegy to the Amazon opensearch cluster
   * @param {string} id a unique id
   * @param {string} name the role name
   * @param {object} template the permissions template
   */
  public addRollupStrategy(id: string, name: string, template: any) {
    this.apiCustomResource(id, '_plugins/_rollup/jobs/' + name, template);
  }
}