// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { RemovalPolicy } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  Cluster,
  KubernetesVersion,
} from 'aws-cdk-lib/aws-eks';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { KarpenterVersion } from '../../karpenter-releases';

/**
 * The properties for the `SparkEmrContainerRuntime` Construct class.
 */
export interface SparkEmrContainersRuntimeProps {
  /**
   * The name of the EKS cluster to create
   * @default -  The [DEFAULT_CLUSTER_NAME](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/spark-runtime/emr-containers/spark-emr-containers-runtime.ts#L65)
   */
  readonly eksClusterName?: string;
  /**
   * The IAM Role to configure in the EKS master roles. It will give access to kubernetes cluster from the AWS console.
   * You will use this role to manage the EKS cluster and grant other access to it.
   * @default - An admin role must be passed if `eksCluster` property is not set.
   */
  readonly eksAdminRole?: IRole;
  /**
   * The EKS Cluster to setup EMR on. The cluster needs to be created in the same CDK Stack.
   * If the EKS Cluster is provided, the cluster AddOns and all the controllers (ALB Ingress controller, Karpenter...) need to be configured.
   * When providing an EKS cluster, the methods for adding nodegroups can still be used. They implement the best practices for running Spark on EKS.
   * @default - An EKS Cluster is created
   */
  readonly eksCluster?: Cluster;
  /**
   * The Kubernetes version used to create the EKS Cluster
   * @default - [DEFAULT_EKS_VERSION](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/spark-runtime/emr-containers/spark-emr-containers-runtime.ts#L61)
   */
  readonly kubernetesVersion?: KubernetesVersion;
  /**
   * The flag to create default Karpenter Node Provisioners for:
   *  * Critical jobs which use on-demand instances, high speed disks and workload isolation
   *  * Shared workloads which use EC2 Spot Instances and no isolation to optimize costs
   *  * Notebooks which leverage a cost optimized configuration for running EMR managed endpoints and spark drivers/executors.
   * @default -  true
   */
  readonly defaultNodes?: boolean;
  /**
   * The Karpenter version to use for autoscaling nodes in the EKS Cluster.
   * @default - [DEFAULT_KARPENTER_VERSION](https://github.com/awslabs/data-solutions-framework-on-aws/blob/HEAD/framework/src/processing/lib/karpenter-releases.ts#L11)
   */
  readonly karpenterVersion?: KarpenterVersion;
  /**
   * The Lambda Layer with Kubectl to use for EKS Cluster setup.
   * Starting k8s 1.22, CDK no longer bundle the Kubectl layer with the code due to breaking npm package size.
   * A layer needs to be passed to the Construct.
   *
   * The CDK [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html#static-v1_22)
   * contains the libraries that you should add for the right Kubernetes version.
   */
  readonly kubectlLambdaLayer: ILayerVersion;

  /**
   * The CIDR of the VPC to use when creating the EKS cluster. If provided, a VPC with three public subnets and three private subnets is created.
   * The size of the private subnets is four time the one of the public subnet.
   * @default - The CIDR 10.0.0.0/16 is used
   */
  readonly vpcCidr?: string;
  /**
   * The VPC to use when creating the EKS cluster.
   * VPC should have at least two private and public subnets in different Availability Zones.
   * All private subnets must have the following tags:
   *  * 'for-use-with-amazon-emr-managed-policies'='true'
   *  * 'kubernetes.io/role/internal-elb'='1'
   * All public subnets must have the following tag:
   *  * 'kubernetes.io/role/elb'='1'
   * Cannot be combined with `vpcCidr`. If combined, `vpcCidr` takes precedence and a new VPC is created.
   * @default - A new VPC is created.
   */
  readonly eksVpc?: IVpc;
  /**
   * The CIDR blocks that are allowed to access to your cluster’s public Kubernetes API server endpoint.
   */
  readonly publicAccessCIDRs: string[];
  /**
   * The IAM Role used for the cluster nodes instance profile.
   * @default - A role is created with AmazonEKSWorkerNodePolicy, AmazonEC2ContainerRegistryReadOnly,
   * AmazonSSMManagedInstanceCore and AmazonEKS_CNI_Policy AWS managed policies.
   */
  readonly ec2InstanceRole?: IRole;
  /**
   * Flag to create an IAM Service Linked Role for EMR on EKS.
   * @default - true
   */
  readonly createEmrOnEksServiceLinkedRole?: boolean;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}


/**
* The properties for the EMR Managed Endpoint to create.
*/
export interface SparkEmrContainersRuntimeInteractiveSessionProps {
  /**
   * The name of the EMR managed endpoint
   */
  readonly managedEndpointName: string;
  /**
   * The Id of the Amazon EMR virtual cluster containing the managed endpoint
   */
  readonly virtualClusterId: string;
  /**
   * The Amazon IAM role used as the execution role, this role must provide access to all the AWS resource a user will interact with
   * These can be S3, DynamoDB, Glue Catalog
   */
  readonly executionRole: IRole;
  /**
   * The Amazon EMR version to use
   * @default - The [default Amazon EMR version]{@link EmrEksCluster.DEFAULT_EMR_VERSION}
   */
  readonly emrOnEksVersion?: EmrVersion;
  /**
   * The JSON configuration overrides for Amazon EMR on EKS configuration attached to the managed endpoint
   * @default - Configuration related to the [default nodegroup for notebook]{@link EmrEksNodegroup.NOTEBOOK_EXECUTOR}
   */
  readonly configurationOverrides?: string;
}

