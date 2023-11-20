// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { readFileSync } from 'fs';
import { join } from 'path';
import { Aws, Stack, Tags, CfnJson, RemovalPolicy } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  AlbControllerVersion,
  Cluster,
  ClusterLoggingTypes,
  EndpointAccess,
  HelmChart,
  KubernetesVersion,
  ServiceAccount,
} from 'aws-cdk-lib/aws-eks';
import { CfnVirtualCluster } from 'aws-cdk-lib/aws-emrcontainers';
import {
  CfnInstanceProfile,
  CfnServiceLinkedRole,
  Effect,
  FederatedPrincipal,
  IManagedPolicy,
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket, BucketEncryption, Location } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as SimpleBase from 'simple-base';
import { createNamespace, ebsCsiDriverSetup, awsNodeRoleSetup, toolingManagedNodegroupSetup } from './emr-eks-cluster-helpers';
import { SparkEmrContainersRuntimeProps } from './emr-eks-cluster-props';
import { karpenterSetup, setDefaultKarpenterProvisioners } from './emr-eks-karpenter-helpers';
import { EmrVirtualClusterProps } from './emr-virtual-cluster-props';
import * as CriticalDefaultConfig from './resources/k8s/emr-eks-config/critical.json';
import * as NotebookDefaultConfig from './resources/k8s/emr-eks-config/notebook-pod-template-ready.json';
import * as SharedDefaultConfig from './resources/k8s/emr-eks-config/shared.json';
import { Context, TrackedConstruct, TrackedConstructProps, Utils, vpcBootstrap } from '../../../../utils';
import { EMR_DEFAULT_VERSION } from '../../emr-releases';
import { DEFAULT_KARPENTER_VERSION } from '../../karpenter-releases';

/**
 * A construct to create an EKS cluster, configure it and enable it with EMR on EKS
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/spark-emr-containers-runtime
*/
export class SparkEmrContainersRuntime extends TrackedConstruct {

  public static readonly DEFAULT_EMR_EKS_VERSION = EMR_DEFAULT_VERSION;
  public static readonly DEFAULT_EKS_VERSION = KubernetesVersion.V1_27;
  public static readonly DEFAULT_CLUSTER_NAME = 'data-platform';
  public static readonly DEFAULT_VPC_CIDR = '10.0.0.0/16';

  /**
   * Get an existing EmrEksCluster based on the cluster name property or create a new one
   * only one EKS cluster can exist per stack
   * @param {Construct} scope the CDK scope used to search or create the cluster
   * @param {EmrEksClusterProps} props the EmrEksClusterProps [properties]{@link EmrEksClusterProps} if created
   */
  public static getOrCreate(scope: Construct, props: SparkEmrContainersRuntimeProps) {

    const stack = Stack.of(scope);
    const id = props.eksClusterName || SparkEmrContainersRuntime.DEFAULT_CLUSTER_NAME;

    let emrEksCluster: SparkEmrContainersRuntime =
      stack.node.tryFindChild(id) as SparkEmrContainersRuntime ??
      new SparkEmrContainersRuntime(stack, id, props);

    return emrEksCluster;
  }

  public readonly eksCluster: Cluster;
  public readonly csiDriverIrsa?: ServiceAccount;
  public readonly awsNodeRole?: IRole;

  public readonly notebookDefaultConfig?: string;
  public readonly criticalDefaultConfig?: string;
  public readonly sharedDefaultConfig?: string;
  public readonly assetBucket: Bucket;
  // public readonly clusterName: string;
  public readonly podTemplateS3LocationCriticalDriver?: string;
  public readonly podTemplateS3LocationCriticalExecutor?: string;
  public readonly podTemplateS3LocationDriverShared?: string;
  public readonly podTemplateS3LocationExecutorShared?: string;
  public readonly podTemplateS3LocationNotebookDriver?: string;
  public readonly podTemplateS3LocationNotebookExecutor?: string;


  private readonly emrServiceRole?: CfnServiceLinkedRole;
  private readonly assetUploadBucketRole: Role;
  private readonly karpenterChart?: HelmChart;
  private readonly defaultNodes: boolean;
  private readonly createEmrOnEksServiceLinkedRole: boolean;
  private readonly logKmsKey: Key;
  private readonly eksSecretKmsKey: Key;
  private readonly podTemplateLocation: Location;
  /**
   * Constructs a new instance of the EmrEksCluster construct.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {EmrEksClusterProps} props the EmrEksClusterProps [properties]{@link EmrEksClusterProps}
   */
  private constructor(scope: Construct, id: string, props: SparkEmrContainersRuntimeProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: SparkEmrContainersRuntime.name,
    };

    super(scope, id, trackedConstructProps);

    let removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    this.logKmsKey = new Key(scope, 'logKmsKey', {
      enableKeyRotation: true,
      alias: 'log-vpc-key',
      removalPolicy: removalPolicy,
    });

    this.eksSecretKmsKey = Stack.of(scope).node.tryFindChild('eksSecretKmsKey') as Key ?? new Key(scope, 'eksSecretKmsKey', {
      enableKeyRotation: true,
      alias: 'eks-secrets-key',
      removalPolicy: removalPolicy,
    });

    const clusterName = props.eksClusterName ?? SparkEmrContainersRuntime.DEFAULT_CLUSTER_NAME;

    //Define EKS cluster logging
    const eksClusterLogging: ClusterLoggingTypes[] = [
      ClusterLoggingTypes.API,
      ClusterLoggingTypes.AUTHENTICATOR,
      ClusterLoggingTypes.SCHEDULER,
      ClusterLoggingTypes.CONTROLLER_MANAGER,
      ClusterLoggingTypes.AUDIT,
    ];

    //Set the flag for creating the EMR on EKS Service Linked Role
    this.createEmrOnEksServiceLinkedRole = props.createEmrOnEksServiceLinkedRole ?? true;

    //Set flag for default karpenter provisioners for Spark jobs
    this.defaultNodes = props.defaultNodes ?? true;

    const karpenterVersion = props.karpenterVersion ?? DEFAULT_KARPENTER_VERSION;

    // Create a role to be used as instance profile for nodegroups
    let ec2InstanceNodeGroupRole = new Role(scope, 'ec2InstanceNodeGroupRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    //attach policies to the role to be used by the nodegroups
    ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
    ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));

    //Create instance profile to be used by Managed nodegroup and karpenter
    const clusterInstanceProfile = new CfnInstanceProfile(scope, 'karpenter-instance-profile', {
      roles: [ec2InstanceNodeGroupRole.roleName],
      instanceProfileName: `adsfNodeInstanceProfile-${clusterName ?? 'default'}`,
      path: '/',
    });

    // create an Amazon EKS CLuster with default parameters if not provided in the properties
    if (props.eksCluster == undefined) {

      const vpcCidr = props.vpcCidr ? props.vpcCidr : SparkEmrContainersRuntime.DEFAULT_VPC_CIDR;

      let eksVpc: IVpc = props.eksVpc ? props.eksVpc : vpcBootstrap (scope, vpcCidr, this.logKmsKey, removalPolicy, clusterName, undefined).vpc;

      this.eksCluster = new Cluster(scope, `${clusterName}Cluster`, {
        defaultCapacity: 0,
        clusterName: clusterName,
        version: props.kubernetesVersion ?? SparkEmrContainersRuntime.DEFAULT_EKS_VERSION,
        clusterLogging: eksClusterLogging,
        kubectlLayer: props.kubectlLambdaLayer,
        vpc: eksVpc,
        endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
        secretsEncryptionKey: this.eksSecretKmsKey,
        albController: {
          version: AlbControllerVersion.V2_5_1,
          policy: JSON.parse(readFileSync(join(__dirname, 'resources/k8s/controllers-iam-policies/alb/iam-policy-alb-v2.5.json'), 'utf8')),
        },
      });

      // Add the provided Amazon IAM Role as Amazon EKS Admin
      if (props.eksAdminRole === undefined) {
        throw new Error('An IAM role must be passed to create an EKS cluster');

      } else {
        this.eksCluster.awsAuth.addMastersRole(props.eksAdminRole, 'AdminRole');
      }

      // Configure the EBS CSI controler
      this.csiDriverIrsa = ebsCsiDriverSetup(this, this.eksCluster, props.kubernetesVersion ?? SparkEmrContainersRuntime.DEFAULT_EKS_VERSION);

      // Configure the AWS Node Role
      this.awsNodeRole = awsNodeRoleSetup(this, this.eksCluster);

      // Configure the tooling nodegroup for hosting tooling components
      toolingManagedNodegroupSetup(this, this.eksCluster, ec2InstanceNodeGroupRole);

      //Deploy karpenter
      this.karpenterChart = karpenterSetup(
        this.eksCluster,
        clusterName,
        scope,
        clusterInstanceProfile,
        ec2InstanceNodeGroupRole,
        karpenterVersion,
      );

    } else {
      //Initialize with the provided EKS Cluster
      this.eksCluster = props.eksCluster;
    }

    //Check if the user want to use the default Karpenter provisioners and
    //Add the defaults pre-configured and optimized to run Spark workloads
    if (this.defaultNodes ) {
      setDefaultKarpenterProvisioners(this, karpenterVersion, ec2InstanceNodeGroupRole);
    }

    // Tags the Amazon VPC and Subnets of the Amazon EKS Cluster
    Tags.of(this.eksCluster.vpc).add(
      'for-use-with-amazon-emr-managed-policies',
      'true',
    );

    this.eksCluster.vpc.privateSubnets.forEach((subnet) =>
      Tags.of(subnet).add('for-use-with-amazon-emr-managed-policies', 'true'),
    );

    this.eksCluster.vpc.publicSubnets.forEach((subnet) =>
      Tags.of(subnet).add('for-use-with-amazon-emr-managed-policies', 'true'),
    );

    // Create Amazon IAM ServiceLinkedRole for Amazon EMR and add to kubernetes configmap
    // required to add a dependency on the Amazon EMR virtual cluster
    if (this.createEmrOnEksServiceLinkedRole) {
      this.emrServiceRole = new CfnServiceLinkedRole(this, 'EmrServiceRole', {
        awsServiceName: 'emr-containers.amazonaws.com',
      });
    }

    this.eksCluster.awsAuth.addRoleMapping(
      Role.fromRoleArn(
        this,
        'ServiceRoleForAmazonEMRContainers',
        `arn:aws:iam::${Stack.of(this).account}:role/AWSServiceRoleForAmazonEMRContainers`,
      ),
      {
        username: 'emr-containers',
        groups: [''],
      },
    );

    // Create an Amazon S3 Bucket for default podTemplate assets
    this.assetBucket = new Bucket (this, 'assetBucket', {
      encryption: BucketEncryption.KMS_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Configure the podTemplate location
    this.podTemplateLocation = {
      bucketName: this.assetBucket.bucketName,
      objectKey: `${this.eksCluster.clusterName}/pod-template`,
    };

    let s3DeploymentLambdaPolicyStatement: PolicyStatement[] = [];

    s3DeploymentLambdaPolicyStatement.push(new PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`],
      effect: Effect.ALLOW,
    }));

    //Policy to allow lambda access to cloudwatch logs
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 's3BucketDeploymentPolicy', {
      statements: s3DeploymentLambdaPolicyStatement,
      description: 'Policy used by S3 deployment cdk construct',
    });

    //Create an execution role for the lambda and attach to it a policy formed from user input
    this.assetUploadBucketRole = new Role(this,
      's3BucketDeploymentRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role used by S3 deployment cdk construct',
        managedPolicies: [lambdaExecutionRolePolicy],
      });


    if (props.defaultNodes) {

      // Upload the default podTemplate to the Amazon S3 asset bucket
      this.uploadPodTemplate('defaultPodTemplates', join(__dirname, 'resources/k8s/pod-template'));

      // Replace the pod template location for driver and executor with the correct Amazon S3 path in the notebook default config
      NotebookDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-driver.yaml`);
      this.podTemplateS3LocationNotebookDriver = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-driver.yaml`);

      NotebookDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-executor.yaml`);
      this.podTemplateS3LocationNotebookExecutor = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-executor.yaml`);

      this.notebookDefaultConfig = JSON.parse(JSON.stringify(NotebookDefaultConfig));

      // Replace the pod template location for driver and executor with the correct Amazon S3 path in the critical default config
      CriticalDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-driver.yaml`);
      this.podTemplateS3LocationCriticalDriver = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-driver.yaml`);

      CriticalDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-executor.yaml`);
      this.podTemplateS3LocationCriticalExecutor = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-executor.yaml`);

      this.criticalDefaultConfig = JSON.stringify(CriticalDefaultConfig);

      // Replace the pod template location for driver and executor with the correct Amazon S3 path in the shared default config
      SharedDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-driver.yaml`);
      this.podTemplateS3LocationDriverShared=this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-driver.yaml`);

      SharedDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] =
      this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-executor.yaml`);
      this.podTemplateS3LocationExecutorShared=this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-executor.yaml`);

      this.sharedDefaultConfig = JSON.stringify(SharedDefaultConfig);

    }

  }

  /**
   * Add a new Amazon EMR Virtual Cluster linked to Amazon EKS Cluster.
   * @param {Construct} scope of the stack where virtual cluster is deployed
   * @param {EmrVirtualClusterProps} options the EmrVirtualClusterProps [properties]{@link EmrVirtualClusterProps}
   */
  public addEmrVirtualCluster(scope: Construct, options: EmrVirtualClusterProps): CfnVirtualCluster {
    const eksNamespace = options.eksNamespace ?? 'default';

    let ns = undefined;

    if (options.createNamespace) {
      ns = createNamespace(this.eksCluster, options.eksNamespace!);
    }

    // deep clone the Role Binding template object and replace the namespace
    let manifest = Utils.readYamlDocument(`${__dirname}/resources/k8s/rbac/emr-containers-rbac.yaml`);

    manifest = manifest.replace(/(\{{NAMESPACE}})/g, eksNamespace);

    let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

    const manifestApply = this.eksCluster.addManifest(`emr-containers-rbac-${eksNamespace}`, ...manfifestYAML);

    if (ns) {manifestApply.node.addDependency(ns);}

    const virtualCluster = new CfnVirtualCluster(scope, `${options.name}VirtualCluster`, {
      name: options.name,
      containerProvider: {
        id: this.eksCluster.clusterName,
        type: 'EKS',
        info: { eksInfo: { namespace: options.eksNamespace ?? 'default' } },
      },
    });

    virtualCluster.node.addDependency(manifestApply);

    if (this.emrServiceRole) {
      manifestApply.node.addDependency(this.emrServiceRole);
      virtualCluster.node.addDependency(this.emrServiceRole);
    }

    if (ns) {virtualCluster.node.addDependency(ns);}

    return virtualCluster;
  }


  /**
   * Create and configure a new Amazon IAM Role usable as an execution role.
   * This method makes the created role assumed by the Amazon EKS cluster Open ID Connect provider.
   * @param {Construct} scope of the IAM role
   * @param {string} id of the CDK resource to be created, it should be unique across the stack
   * @param {IManagedPolicy} policy the execution policy to attach to the role
   * @param {string} eksNamespace The namespace from which the role is going to be used. MUST be the same as the namespace of the Virtual Cluster from which the job is submitted
   * @param {string} name Name to use for the role, required and is used to scope the iam role
   */
  public createExecutionRole(scope: Construct, id: string, policy: IManagedPolicy, eksNamespace: string, name: string): Role {

    const stack = Stack.of(scope);

    let irsaConditionkey: CfnJson = new CfnJson(scope, `${id}irsaConditionkey'`, {
      value: {
        [`${this.eksCluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: 'system:serviceaccount:' + eksNamespace + ':emr-containers-sa-*-*-' + Aws.ACCOUNT_ID.toString() + '-' + SimpleBase.base36.encode(name),
      },
    });

    // Create an execution role assumable by EKS OIDC provider
    return new Role(scope, `${id}ExecutionRole`, {
      assumedBy: new FederatedPrincipal(
        this.eksCluster.openIdConnectProvider.openIdConnectProviderArn,
        {
          StringLike: irsaConditionkey,
        },
        'sts:AssumeRoleWithWebIdentity'),
      roleName: name,
      managedPolicies: [policy],
      inlinePolicies: {
        PodTemplateAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                's3:getObject',
              ],
              resources: [
                stack.formatArn({
                  region: '',
                  account: '',
                  service: 's3',
                  resource: this.podTemplateLocation.bucketName,
                  resourceName: `${this.podTemplateLocation.objectKey}/*`,
                }),
              ],
            }),
          ],
        }),
      },
    });
  }

  /**
   * Upload podTemplates to the Amazon S3 location used by the cluster.
   * @param {string} id the unique ID of the CDK resource
   * @param {string} filePath The local path of the yaml podTemplate files to upload
   */
  public uploadPodTemplate(id: string, filePath: string) {

    new BucketDeployment(this, `${id}AssetDeployment`, {
      destinationBucket: this.assetBucket,
      destinationKeyPrefix: this.podTemplateLocation.objectKey,
      sources: [Source.asset(filePath)],
      role: this.assetUploadBucketRole,
    });
  }

  /**
   * Apply the provided manifest and add the CDK dependency on EKS cluster
   * @param {string} id the unique ID of the CDK resource
   * @param {any} manifest The manifest to apply.
   * You can use the Utils class that offers method to read yaml file and load it as a manifest
   */
  public addKarpenterProvisioner(id: string, manifest: any): any {

    let manifestApply = this.eksCluster.addManifest(id, ...manifest);

    if (this.karpenterChart) {
      manifestApply.node.addDependency(this.karpenterChart);
    }

    return manifestApply;
  }
}

