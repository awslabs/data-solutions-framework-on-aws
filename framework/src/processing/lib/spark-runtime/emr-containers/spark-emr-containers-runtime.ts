// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { readFileSync } from 'fs';
import { join } from 'path';
import { Aws, Stack, Tags, CfnJson, RemovalPolicy } from 'aws-cdk-lib';
import { IGatewayVpcEndpoint, ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  AlbControllerVersion,
  Cluster,
  ClusterLoggingTypes,
  EndpointAccess,
  HelmChart,
  KubernetesVersion,
} from 'aws-cdk-lib/aws-eks';
import { CfnVirtualCluster } from 'aws-cdk-lib/aws-emrcontainers';
import { IRule } from 'aws-cdk-lib/aws-events';
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
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, IBucket, Location } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as SimpleBase from 'simple-base';
import { createNamespace, ebsCsiDriverSetup, awsNodeRoleSetup, toolingManagedNodegroupSetup } from './eks-cluster-helpers';
import { karpenterSetup, setDefaultKarpenterProvisioners } from './eks-karpenter-helpers';
import { EmrVirtualClusterProps } from './emr-virtual-cluster-props';
import * as CriticalDefaultConfig from './resources/k8s/emr-eks-config/critical.json';
import * as NotebookDefaultConfig from './resources/k8s/emr-eks-config/notebook-pod-template-ready.json';
import * as SharedDefaultConfig from './resources/k8s/emr-eks-config/shared.json';
import { SparkEmrContainersRuntimeProps } from './spark-emr-containers-runtime-props';
import { Context, DataVpc, TrackedConstruct, TrackedConstructProps, Utils } from '../../../../utils';
import { EMR_DEFAULT_VERSION } from '../../emr-releases';
import { DEFAULT_KARPENTER_VERSION } from '../../karpenter-releases';

/**
 * A construct to create an EKS cluster, configure it and enable it with EMR on EKS
 * @see https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/spark-emr-containers-runtime
*/
export class SparkEmrContainersRuntime extends TrackedConstruct {

  /**
   *  The default EMR on EKS version
   */
  public static readonly DEFAULT_EMR_EKS_VERSION = EMR_DEFAULT_VERSION;
  /**
   * The default EKS version
   */
  public static readonly DEFAULT_EKS_VERSION = KubernetesVersion.V1_27;
  /**
   * The default name of the EKS cluster
   */
  public static readonly DEFAULT_CLUSTER_NAME = 'data-platform';
  /**
   * The default CIDR when the VPC is created
   */
  public static readonly DEFAULT_VPC_CIDR = '10.0.0.0/16';

  /**
   * Get an existing EmrEksCluster based on the cluster name property or create a new one
   * only one EKS cluster can exist per stack
   * @param {Construct} scope the CDK scope used to search or create the cluster
   * @param {EmrEksClusterProps} props the EmrEksClusterProps [properties]{@link EmrEksClusterProps} if created
   */
  public static getOrCreate(scope: Construct, props: SparkEmrContainersRuntimeProps) {

    const stack = Stack.of(scope);
    const id = Utils.toPascalCase(props.eksClusterName || SparkEmrContainersRuntime.DEFAULT_CLUSTER_NAME);

    let emrEksCluster: SparkEmrContainersRuntime =
      stack.node.tryFindChild(id) as SparkEmrContainersRuntime ??
      new SparkEmrContainersRuntime(stack, id, props);

    return emrEksCluster;
  }

  /**
   * The EKS cluster created by the construct if it is not provided
   */
  public readonly eksCluster: Cluster;
  /**
   * The IAM Role used by IRSA for the aws-node daemonset
   */
  public readonly awsNodeRole?: IRole;
  /**
   * The IAM role used by the tooling managed nodegroup hosting core Kubernetes controllers
   * like EBS CSI driver, core dns
   */
  public readonly ec2InstanceNodeGroupRole: IRole;
  /**
   * The SQS queue used by Karpenter to receive critical events from AWS services which may affect your nodes.
   */
  public readonly karpenterQueue?: IQueue;
  /**
   * The security group used by the EC2NodeClass of the default nodes
   */
  public readonly karpenterSecurityGroup?: ISecurityGroup;
  /**
   * The rules used by Karpenter to track node health, rules are defined in the cloudformation below
   * https://raw.githubusercontent.com/aws/karpenter/"${KARPENTER_VERSION}"/website/content/en/preview/getting-started/getting-started-with-karpenter/cloudformation.yaml
   */
  public readonly karpenterEventRules?: Array<IRule>;

  /**
   * The configuration override for the spark application to use with the default nodes dedicated for notebooks
   */
  public readonly notebookDefaultConfig?: string;
  /**
   * The configuration override for the spark application to use with the default nodes for criticale jobs
   */
  public readonly criticalDefaultConfig?: string;
  /**
   * The configuration override for the spark application to use with the default nodes for none criticale jobs
   */
  public readonly sharedDefaultConfig?: string;
  /**
   * The bucket holding podtemplates referenced in the configuration override for the job
   */
  public readonly assetBucket?: IBucket;

  /**
   * The S3 location holding the driver pod tempalte for critical nodes
   */
  public readonly podTemplateS3LocationCriticalDriver?: string;
  /**
   * The S3 location holding the executor pod tempalte for critical nodes
   */
  public readonly podTemplateS3LocationCriticalExecutor?: string;
  /**
   * The S3 location holding the driver pod tempalte for shared nodes
   */
  public readonly podTemplateS3LocationDriverShared?: string;
  /**
   * The S3 location holding the executor pod tempalte for shared nodes
   */
  public readonly podTemplateS3LocationExecutorShared?: string;
  /**
   * The S3 location holding the driver pod tempalte for interactive sessions
   */
  public readonly podTemplateS3LocationNotebookDriver?: string;
  /**
   * The S3 location holding the executor pod tempalte for interactive sessions
   */
  public readonly podTemplateS3LocationNotebookExecutor?: string;
  /**
   * The IAM Role created for the EBS CSI controller
   */
  public readonly csiDriverIrsaRole?: IRole;
  /**
   * The IAM role created for the Karpenter controller
   */
  public readonly karpenterIrsaRole?: IRole;
  /**
   * The VPC used by the EKS cluster
   */
  public readonly vpc!: IVpc;
  /**
   * The KMS Key used for the VPC flow logs when the VPC is created
   */
  public readonly flowLogKey?: IKey;
  /**
   * The IAM Role used for the VPC flow logs when the VPC is created
   */
  public readonly flowLogRole?: IRole;
  /**
   * The S3 VPC endpoint attached to the private subnets of the VPC when VPC is created
   */
  public readonly s3VpcEndpoint?: IGatewayVpcEndpoint;
  /**
   * The CloudWatch Log Group for the VPC flow log when the VPC is created
   */
  public readonly flowLogGroup?: ILogGroup;

  /**
   * The Service Linked role created for EMR
   */
  public readonly emrServiceRole?: CfnServiceLinkedRole;
  /**
   * The KMS key used for storing EKS secrets
   */
  public readonly eksSecretKmsKey?: IKey;
  /**
   * The IAM role used to upload assets (pod templates) on S3
   */
  public readonly assetUploadBucketRole?: IRole;

  private readonly karpenterChart?: HelmChart;
  private readonly defaultNodes?: boolean;
  private readonly createEmrOnEksServiceLinkedRole?: boolean;
  private readonly podTemplateLocation: Location;
  private readonly podTemplatePolicy: PolicyDocument;
  private readonly removalPolicy: RemovalPolicy;
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

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);

    // Create a role to be used as instance profile for nodegroups
    this.ec2InstanceNodeGroupRole = props.ec2InstanceRole || new Role(this, 'Ec2InstanceNodeGroupRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    //attach policies to the role to be used by the nodegroups
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));

    //Create instance profile to be used by Managed nodegroup and karpenter
    const clusterInstanceProfile = new CfnInstanceProfile(scope, 'KarpenterInstanceProfile', {
      roles: [this.ec2InstanceNodeGroupRole.roleName],
      // instanceProfileName: `adsfNodeInstanceProfile-${clusterName ?? 'default'}`,
      path: '/',
    });

    const karpenterVersion = props.karpenterVersion ?? DEFAULT_KARPENTER_VERSION;

    let eksCluster: Cluster;

    // create an Amazon EKS CLuster with default parameters if not provided in the properties
    if (props.eksCluster == undefined) {

      this.eksSecretKmsKey = new Key(scope, 'EksSecretKmsKey', {
        enableKeyRotation: true,
        description: 'eks-secrets-key',
        removalPolicy: this.removalPolicy,
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

      const vpcCidr = props.vpcCidr ? props.vpcCidr : SparkEmrContainersRuntime.DEFAULT_VPC_CIDR;

      if (props.eksVpc === undefined) {
        const dataVpc = new DataVpc(this, 'DataVpc', {
          vpcCidr: vpcCidr,
          removalPolicy: this.removalPolicy,
        });
        this.vpc = dataVpc.vpc;
        this.flowLogKey = dataVpc.flowLogKey;
        this.flowLogRole = dataVpc.flowLogRole;
        this.flowLogGroup = dataVpc.flowLogGroup;
        this.s3VpcEndpoint = dataVpc.s3VpcEndpoint;
        // tag the VPC and subnets for Karpenter
        dataVpc.tagVpc('karpenter.sh/discovery', clusterName);
      } else {
        this.vpc = props.eksVpc;
      }

      eksCluster = new Cluster(scope, 'EksCluster', {
        defaultCapacity: 0,
        clusterName: clusterName,
        version: props.kubernetesVersion ?? SparkEmrContainersRuntime.DEFAULT_EKS_VERSION,
        clusterLogging: eksClusterLogging,
        kubectlLayer: props.kubectlLambdaLayer,
        vpc: this.vpc,
        endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
        secretsEncryptionKey: this.eksSecretKmsKey,
        albController: {
          version: AlbControllerVersion.V2_5_1,
          policy: JSON.parse(readFileSync(join(__dirname, 'resources/k8s/controllers-iam-policies/alb/iam-policy-alb-v2.5.json'), 'utf8')),
        },
        placeClusterHandlerInVpc: true,
      });

      // Add the provided Amazon IAM Role as Amazon EKS Admin
      if (props.eksAdminRole === undefined) {
        throw new Error('An IAM role must be passed to create an EKS cluster');
      } else {
        eksCluster.awsAuth.addMastersRole(props.eksAdminRole, 'AdminRole');
      }

      // Configure the EBS CSI controler
      this.csiDriverIrsaRole = ebsCsiDriverSetup(this, eksCluster, props.kubernetesVersion ?? SparkEmrContainersRuntime.DEFAULT_EKS_VERSION);

      // Configure the AWS Node Role
      this.awsNodeRole = awsNodeRoleSetup(this, eksCluster);

      // Configure the tooling nodegroup for hosting tooling components
      toolingManagedNodegroupSetup(this, eksCluster, this.ec2InstanceNodeGroupRole);

      //Deploy karpenter
      [this.karpenterChart, this.karpenterIrsaRole, this.karpenterQueue, this.karpenterSecurityGroup, this.karpenterEventRules] = karpenterSetup(
        eksCluster,
        clusterName,
        scope,
        clusterInstanceProfile,
        this.ec2InstanceNodeGroupRole,
        this.removalPolicy,
        karpenterVersion,
      );

    } else {
      //Initialize with the provided EKS Cluster
      eksCluster = props.eksCluster;
    }

    this.eksCluster = eksCluster;

    // Create an Amazon S3 Bucket for podTemplate assets
    this.assetBucket = new Bucket (this, 'AssetBucket', {
      encryption: BucketEncryption.KMS_MANAGED,
      enforceSSL: true,
      removalPolicy: this.removalPolicy,
      autoDeleteObjects: this.removalPolicy == RemovalPolicy.DESTROY,
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
    const lambdaExecutionRolePolicy = new ManagedPolicy(this, 'S3BucketDeploymentPolicy', {
      statements: s3DeploymentLambdaPolicyStatement,
      description: 'Policy used by S3 deployment cdk construct',
    });

    //Create an execution role for the lambda and attach to it a policy formed from user input
    this.assetUploadBucketRole = new Role(this, 'S3BucketDeploymentRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role used by S3 deployment cdk construct',
      managedPolicies: [lambdaExecutionRolePolicy],
    });

    const stack = Stack.of(scope);

    this.podTemplatePolicy = new PolicyDocument({
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
    });

    if (this.defaultNodes ) {
      setDefaultKarpenterProvisioners(this, karpenterVersion, this.ec2InstanceNodeGroupRole);

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

    // Tags the Amazon VPC and Subnets of the Amazon EKS Cluster
    Tags.of(eksCluster.vpc).add(
      'for-use-with-amazon-emr-managed-policies',
      'true',
    );

    eksCluster.vpc.privateSubnets.forEach((subnet) =>
      Tags.of(subnet).add('for-use-with-amazon-emr-managed-policies', 'true'),
    );

    eksCluster.vpc.publicSubnets.forEach((subnet) =>
      Tags.of(subnet).add('for-use-with-amazon-emr-managed-policies', 'true'),
    );

    // Create Amazon IAM ServiceLinkedRole for Amazon EMR and add to kubernetes configmap
    // required to add a dependency on the Amazon EMR virtual cluster
    if (this.createEmrOnEksServiceLinkedRole) {
      this.emrServiceRole = new CfnServiceLinkedRole(this, 'EmrServiceRole', {
        awsServiceName: 'emr-containers.amazonaws.com',
      });
    }

    eksCluster.awsAuth.addRoleMapping(
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

    let irsaConditionkey: CfnJson = new CfnJson(scope, `${id}IrsaConditionkey'`, {
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
      inlinePolicies: this.podTemplatePolicy ? { podTemplateAccess: this.podTemplatePolicy! } : undefined,
    });
  }

  /**
   * Upload podTemplates to the Amazon S3 location used by the cluster.
   * @param {string} id the unique ID of the CDK resource
   * @param {string} filePath The local path of the yaml podTemplate files to upload
   */
  public uploadPodTemplate(id: string, filePath: string) {

    new BucketDeployment(this, `${id}AssetDeployment`, {
      destinationBucket: this.assetBucket!,
      destinationKeyPrefix: this.podTemplateLocation!.objectKey,
      sources: [Source.asset(filePath)],
      role: this.assetUploadBucketRole,
      retainOnDelete: this.removalPolicy === RemovalPolicy.RETAIN ? true : false,
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

