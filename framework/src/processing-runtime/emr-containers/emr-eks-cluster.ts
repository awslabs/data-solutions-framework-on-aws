// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { join } from 'path';
import { Aws, CfnOutput, Stack, Tags, RemovalPolicy, CfnJson } from 'aws-cdk-lib';
import { FlowLogDestination, IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  Cluster,
  ClusterLoggingTypes,
  EndpointAccess,
  HelmChart,
  KubernetesVersion,
} from 'aws-cdk-lib/aws-eks';
import { CfnVirtualCluster } from 'aws-cdk-lib/aws-emrcontainers';
import {
  CfnServiceLinkedRole,
  Effect,
  FederatedPrincipal,
  IManagedPolicy,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket, Location } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as SimpleBase from 'simple-base';
import { karpenterSetup, eksClusterSetup, setDefaultKarpenterProvisioners } from './emr-eks-cluster-helpers';
import { EmrVirtualClusterOptions } from './emr-virtual-cluster';
import * as CriticalDefaultConfig from './resources/k8s/emr-eks-config/critical.json';
import * as NotebookDefaultConfig from './resources/k8s/emr-eks-config/notebook-pod-template-ready.json';
import * as SharedDefaultConfig from './resources/k8s/emr-eks-config/shared.json';
import * as K8sRoleBinding from './resources/k8s/rbac/emr-containers-role-binding.json';
import * as K8sRole from './resources/k8s/rbac/emr-containers-role.json';
import { vpcBootstrap } from './vpc-helper';
import { AnalyticsBucket } from '../../data-lake';
import { ContextOptions } from '../../utils/context-options';
import { TrackedConstruct, TrackedConstructProps } from '../../utils/tracked-construct';

/**
 * The different autoscaler available with EmrEksCluster
 */
export enum Autoscaler {
  KARPENTER = 'KARPENTER'
}

/**
 * The different EMR versions available on EKS
 */
export enum EmrVersion {
  V6_12= 'emr-6.12.0-latest',
  V6_11= 'emr-6.11.0-latest',
  V6_10= 'emr-6.10.0-latest',
  V6_9 = 'emr-6.9.0-latest',
  V6_8 = 'emr-6.8.0-latest',
  V6_7 = 'emr-6.7.0-latest',
  V6_6 = 'emr-6.6.0-latest',
  V6_5 = 'emr-6.5.0-latest',
  V6_4 = 'emr-6.4.0-latest',
  V6_3 = 'emr-6.3.0-latest',
  V6_2 = 'emr-6.2.0-latest',
  V5_33 = 'emr-5.33.0-latest',
  V5_32 = 'emr-5.32.0-latest',
}


/**
 * The properties for the EmrEksCluster Construct class.
 */
export interface EmrEksClusterProps {
  /**
   * Name of the Amazon EKS cluster to be created
   * @default -  The [default cluster name]{@link DEFAULT_CLUSTER_NAME}
   */
  readonly eksClusterName?: string;
  /**
   * The autoscaling mechanism to use
   */
  readonly autoscaling: Autoscaler;
  /**
   * Amazon IAM Role to be added to Amazon EKS master roles that will give access to kubernetes cluster from AWS console UI.
   * An admin role must be passed if `eksCluster` property is not set.
   * @default - No admin role is used and EKS cluster creation fails
   */
  readonly eksAdminRoleArn?: string;
  /**
   * The EKS cluster to setup EMR on. The cluster needs to be created in the same CDK Stack.
   * If the EKS cluster is provided, the cluster AddOns and all the controllers (Ingress controller, Cluster Autoscaler or Karpenter...) need to be configured.
   * When providing an EKS cluster, the methods for adding nodegroups can still be used. They implement the best practices for running Spark on EKS.
   * @default - An EKS Cluster is created
   */
  readonly eksCluster?: Cluster;
  /**
   * Kubernetes version for Amazon EKS cluster that will be created
   * @default -  Kubernetes v1.21 version is used
   */
  readonly kubernetesVersion?: KubernetesVersion;
  /**
   * If set to true, the Construct will create default EKS nodegroups or node provisioners (based on the autoscaler mechanism used).
   * There are three types of nodes:
   *  * Nodes for critical jobs which use on-demand instances, high speed disks and workload isolation
   *  * Nodes for shared worklaods which uses spot instances and no isolation to optimize costs
   *  * Nodes for notebooks which leverage a cost optimized configuration for running EMR managed endpoints and spark drivers/executors.
   * @default -  true
   */
  readonly defaultNodes?: boolean;
  /**
   * The version of karpenter to pass to Helm
   * @default - The [default Karpenter version]{@link DEFAULT_KARPENTER_VERSION}
   */
  readonly karpenterVersion?: string;
  /**
   * Starting k8s 1.22, CDK no longer bundle the kubectl layer with the code due to breaking npm package size.
   * A layer needs to be passed to the Construct.
   *
   * The cdk [documentation] (https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html#static-v1_22)
   * contains the libraries that you should add for the right Kubernetes version
   * @default - No layer is used
   */
  readonly kubectlLambdaLayer?: ILayerVersion;

  /**
   * The CIDR of the VPC to use with EKS, if provided a VPC with three public subnets and three private subnet is create
   * The size of the private subnets is four time the one of the public subnet
   * @default - A vpc with the following CIDR 10.0.0.0/16 will be used
   */
  readonly vpcCidr?: string;

  /**
   * The VPC object where to deploy the EKS cluster
   * VPC should have at least two private and public subnets in different Availability Zones
   * All private subnets should have the following tags:
   * 'for-use-with-amazon-emr-managed-policies'='true'
   * 'kubernetes.io/role/internal-elb'='1'
   * All public subnets should have the following tag:
   * 'kubernetes.io/role/elb'='1'
   * Cannot be combined with vpcCidr, if combined vpcCidr takes precendency
   */
  readonly eksVpc?: IVpc;

  /**
  * The CIDR blocks that are allowed access to your cluster’s public Kubernetes API server endpoint.
  */
  readonly publicAccessCIDRs: string[]; 

  /**
  * Wether we need to create an EMR on EKS Service Linked Role
  * @default - true
  */
 readonly createEmrOnEksSlr: boolean;
}

/**
 * EmrEksCluster Construct packaging all the resources and configuration required to run Amazon EMR on EKS.
 * It deploys:
 * * An EKS cluster (VPC configuration can be customized)
 * * A tooling nodegroup to run tools including the Kubedashboard and the Cluster Autoscaler
 * * Optionally multiple nodegroups (one per AZ) for critical/shared/notebook EMR workloads
 * * Additional nodegroups can be configured
 *
 * The construct will upload on S3 the Pod templates required to run EMR jobs on the default nodegroups.
 * It will also parse and store the configuration of EMR on EKS jobs for each default nodegroup in object parameters
 *
 * Methods are available to add EMR Virtual Clusters to the EKS cluster and to create execution roles for the virtual clusters.
 *
 * Usage example:
 *
 * ```typescript
 * const emrEks: EmrEksCluster = EmrEksCluster.getOrCreate(stack, {
 *   eksAdminRoleArn: <ROLE_ARN>,
 *   eksClusterName: <CLUSTER_NAME>,
 * });
 *
 * const virtualCluster = emrEks.addEmrVirtualCluster(stack, {
 *   name: <Virtual_Cluster_Name>,
 *   createNamespace: <TRUE OR FALSE>,
 *   eksNamespace: <K8S_namespace>,
 * });
 *
 * const role = emrEks.createExecutionRole(stack, 'ExecRole',{
 *   policy: <POLICY>,
 * })
 *
 * // EMR on EKS virtual cluster ID
 * cdk.CfnOutput(self, 'VirtualClusterId',value = virtualCluster.attr_id)
 * // Job config for each nodegroup
 * cdk.CfnOutput(self, "CriticalConfig", value = emrEks.criticalDefaultConfig)
 * cdk.CfnOutput(self, "SharedConfig", value = emrEks.sharedDefaultConfig)
 * // Execution role arn
 * cdk.CfnOutput(self,'ExecRoleArn', value = role.roleArn)
 * ```
 *
 */
export class EmrEksCluster extends TrackedConstruct {

  public static readonly DEFAULT_EMR_VERSION = EmrVersion.V6_10;
  public static readonly DEFAULT_EKS_VERSION = KubernetesVersion.V1_25;
  public static readonly DEFAULT_CLUSTER_NAME = 'data-platform';
  public static readonly DEFAULT_KARPENTER_VERSION = 'v0.20.0';

  /**
   * Get an existing EmrEksCluster based on the cluster name property or create a new one
   * only one EKS cluster can exist per stack
   * @param {Construct} scope the CDK scope used to search or create the cluster
   * @param {EmrEksClusterProps} props the EmrEksClusterProps [properties]{@link EmrEksClusterProps} if created
   */
  public static getOrCreate(scope: Construct, props: EmrEksClusterProps) {

    const stack = Stack.of(scope);
    const id = props.eksClusterName || EmrEksCluster.DEFAULT_CLUSTER_NAME;

    let emrEksCluster: EmrEksCluster;

    if (stack.node.tryFindChild(id) == undefined) {
      emrEksCluster = new EmrEksCluster(stack, id, props);
    }

    return stack.node.tryFindChild(id) as EmrEksCluster || emrEksCluster!;
  }

  public readonly eksCluster: Cluster;
  public readonly notebookDefaultConfig: string;
  public readonly criticalDefaultConfig: string;
  public readonly sharedDefaultConfig: string;
  public readonly podTemplateLocation: Location;
  public readonly assetBucket: Bucket;
  public readonly clusterName: string;
  public readonly ec2InstanceNodeGroupRole: Role;
  private readonly emrServiceRole?: CfnServiceLinkedRole;
  private readonly assetUploadBucketRole: Role;
  private readonly karpenterChart?: HelmChart;
  private readonly defaultNodes: boolean;
  /**
   * Constructs a new instance of the EmrEksCluster construct.
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {EmrEksClusterProps} props the EmrEksClusterProps [properties]{@link EmrEksClusterProps}
   */
  private constructor(scope: Construct, id: string, props: EmrEksClusterProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingCode: ContextOptions.EMR_EKS_TRACKING_ID,
    };

    super(scope, id, trackedConstructProps);

    this.clusterName = props.eksClusterName ?? EmrEksCluster.DEFAULT_CLUSTER_NAME;
    //Define EKS cluster logging
    const eksClusterLogging: ClusterLoggingTypes[] = [
      ClusterLoggingTypes.API,
      ClusterLoggingTypes.AUTHENTICATOR,
      ClusterLoggingTypes.SCHEDULER,
      ClusterLoggingTypes.CONTROLLER_MANAGER,
      ClusterLoggingTypes.AUDIT,
    ];

    //Set the autoscaler mechanism flag
    this.defaultNodes = props.defaultNodes == undefined ? true : props.defaultNodes;

    // Create a role to be used as instance profile for nodegroups
    this.ec2InstanceNodeGroupRole = new Role(this, 'ec2InstanceNodeGroupRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    //attach policies to the role to be used by the nodegroups
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    this.ec2InstanceNodeGroupRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));

    // Create the custom resource provider for tagging the EC2 Auto Scaling groups
    // this.nodegroupAsgTagsProviderServiceToken = new EmrEksNodegroupAsgTagProvider(this, 'AsgTagProvider', {
    //   eksClusterName: this.clusterName,
    // }).provider.serviceToken;

    // // Create the custom resource provider for tagging the EC2 Auto Scaling groups
    // this.jobTemplateProviderToken = new EmrEksJobTemplateProvider(this, 'jobTemplateProvider').provider.serviceToken;

    //KMS key for VPC log encryption
    const logKmsKey: Key = new Key(this, 'logKmsKey', {
      enableKeyRotation: true,
      alias: 'log-kms-key',
    });

    // create an Amazon EKS CLuster with default parameters if not provided in the properties
    if (props.eksCluster == undefined) {

      let eksVpc: IVpc | undefined = props.vpcCidr ? vpcBootstrap (scope, props.vpcCidr, this.clusterName) : props.eksVpc;

      this.eksCluster = new Cluster(scope, `${this.clusterName}Cluster`, {
        defaultCapacity: 0,
        clusterName: this.clusterName,
        version: props.kubernetesVersion ?? EmrEksCluster.DEFAULT_EKS_VERSION,
        clusterLogging: eksClusterLogging,
        kubectlLayer: props.kubectlLambdaLayer as ILayerVersion ?? undefined,
        vpc: eksVpc,
        endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE
      });

      //Create VPC flow log for the EKS VPC
      let eksVpcFlowLogLogGroup = new LogGroup(this, 'eksVpcFlowLogLogGroup', {
        logGroupName: `/aws/emr-eks-vpc-flow/${this.clusterName}`,
        encryptionKey: logKmsKey,
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      //Allow vpc flowlog to access KMS key to encrypt logs
      logKmsKey.addToResourcePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal(`logs.${Stack.of(this).region}.amazonaws.com`)],
          actions: [
            'kms:Encrypt*',
            'kms:Decrypt*',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:Describe*',
          ],
          conditions: {
            ArnLike: {
              'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:*`,
            },
          },
          resources: ['*'],
        }),
      );

      //Setup the VPC flow logs
      const iamRoleforFlowLog = new Role(this, 'iamRoleforFlowLog', {
        assumedBy: new ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      });

      this.eksCluster.vpc.addFlowLog('eksVpcFlowLog', {
        destination: FlowLogDestination.toCloudWatchLogs(eksVpcFlowLogLogGroup, iamRoleforFlowLog),
      });

      //Setting up the cluster with the required controller
      eksClusterSetup(this, this, props.eksAdminRoleArn);

      //Deploy karpenter
      this.karpenterChart = karpenterSetup(
        this.eksCluster, this.clusterName, this, props.karpenterVersion ?? EmrEksCluster.DEFAULT_KARPENTER_VERSION,
      );

    } else {
      //Initialize with the provided EKS Cluster
      this.eksCluster = props.eksCluster;
    }

    //Check if there user want to use the default Karpenter provisioners and
    //Add the defaults pre-configured and optimized to run Spark workloads
    if (this.defaultNodes ) {
      setDefaultKarpenterProvisioners(this);
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
    if (props.createEmrOnEksSlr) {

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
    this.assetBucket = new AnalyticsBucket(this, 'assetBucket', {
      bucketName: `${this.clusterName.toLowerCase()}-emr-eks-assets`,
      encryptionKey: logKmsKey,
    });

    // Configure the podTemplate location
    this.podTemplateLocation = {
      bucketName: this.assetBucket.bucketName,
      objectKey: `${this.clusterName}/pod-template`,
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


    // Upload the default podTemplate to the Amazon S3 asset bucket
    this.uploadPodTemplate('defaultPodTemplates', join(__dirname, 'resources/k8s/pod-template'));

    // Replace the pod template location for driver and executor with the correct Amazon S3 path in the notebook default config
    NotebookDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-driver.yaml`);
    NotebookDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/notebook-executor.yaml`);
    this.notebookDefaultConfig = JSON.parse(JSON.stringify(NotebookDefaultConfig));

    // Replace the pod template location for driver and executor with the correct Amazon S3 path in the critical default config
    CriticalDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-driver.yaml`);
    CriticalDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/critical-executor.yaml`);
    this.criticalDefaultConfig = JSON.stringify(CriticalDefaultConfig);

    // Replace the pod template location for driver and executor with the correct Amazon S3 path in the shared default config
    SharedDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.driver.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-driver.yaml`);
    SharedDefaultConfig.applicationConfiguration[0].properties['spark.kubernetes.executor.podTemplateFile'] = this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}/shared-executor.yaml`);
    this.sharedDefaultConfig = JSON.stringify(SharedDefaultConfig);

    // // Set the custom resource provider service token here to avoid circular dependencies
    // this.managedEndpointProviderServiceToken = new EmrManagedEndpointProvider(this, 'ManagedEndpointProvider', {
    //   assetBucket: this.assetBucket,
    // }).provider.serviceToken;

    // Provide the podTemplate location on Amazon S3
    new CfnOutput(this, 'podTemplateLocation', {
      description: 'Use podTemplates in Amazon EMR jobs from this Amazon S3 Location',
      value: this.assetBucket.s3UrlForObject(`${this.podTemplateLocation.objectKey}`),
    });

  }

  /**
   * Add a new Amazon EMR Virtual Cluster linked to Amazon EKS Cluster.
   * @param {Construct} scope of the stack where virtual cluster is deployed
   * @param {EmrVirtualClusterOptions} options the EmrVirtualClusterProps [properties]{@link EmrVirtualClusterProps}
   */

  public addEmrVirtualCluster(scope: Construct, options: EmrVirtualClusterOptions): CfnVirtualCluster {
    const eksNamespace = options.eksNamespace ?? 'default';

    const regex = /^[a-z0-9]+$/g;

    if (!eksNamespace.match(regex)) {
      throw new Error(`Namespace provided violates the constraints of Namespace naming ${eksNamespace}`);
    }

    const ns = options.createNamespace
      ? this.eksCluster.addManifest(`${options.name}Namespace`, {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: eksNamespace },
      })
      : null;

    // deep clone the Role template object and replace the namespace
    const k8sRole = JSON.parse(JSON.stringify(K8sRole));
    k8sRole.metadata.namespace = eksNamespace;
    const role = this.eksCluster.addManifest(`${options.name}Role`, k8sRole);
    

    if (ns) 
      role.node.addDependency(ns);

    // deep clone the Role Binding template object and replace the namespace
    const k8sRoleBinding = JSON.parse(JSON.stringify(K8sRoleBinding));
    k8sRoleBinding.metadata.namespace = eksNamespace;
    const roleBinding = this.eksCluster.addManifest(`${options.name}RoleBinding`, k8sRoleBinding);
    roleBinding.node.addDependency(role);

    const virtCluster = new CfnVirtualCluster(scope, `${options.name}VirtualCluster`, {
      name: options.name,
      containerProvider: {
        id: this.clusterName,
        type: 'EKS',
        info: { eksInfo: { namespace: options.eksNamespace ?? 'default' } },
      }
    });

    virtCluster.node.addDependency(roleBinding);

    if (this.emrServiceRole) {
      role.node.addDependency(this.emrServiceRole);
      virtCluster.node.addDependency(this.emrServiceRole);
    }

    if (ns) {virtCluster.node.addDependency(ns);}

    return virtCluster;
  }


  /**
   * Create and configure a new Amazon IAM Role usable as an execution role.
   * This method makes the created role assumed by the Amazon EKS cluster Open ID Connect provider.
   * @param {Construct} scope of the IAM role
   * @param {string} id of the CDK resource to be created, it should be unique across the stack
   * @param {IManagedPolicy} policy the execution policy to attach to the role
   * @param {string} namespace The namespace from which the role is going to be used. MUST be the same as the namespace of the Virtual Cluster from which the job is submitted
   * @param {string} name Name to use for the role, required and is used to scope the iam role
   */
  public createExecutionRole(scope: Construct, id: string, policy: IManagedPolicy, namespace: string, name: string): Role {

    const stack = Stack.of(this);

    let irsaConditionkey: CfnJson = new CfnJson(this, `${id}irsaConditionkey'`, {
      value: {
        [`${this.eksCluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: 'system:serviceaccount:' + namespace + ':emr-containers-sa-*-*-' + Aws.ACCOUNT_ID.toString() + '-' + SimpleBase.base36.encode(name),
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

